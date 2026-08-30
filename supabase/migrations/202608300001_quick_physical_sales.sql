begin;

create sequence if not exists public.sales_sale_number_seq;

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null default ('TTT-' || lpad(nextval('public.sales_sale_number_seq')::text, 6, '0')),
  channel text not null default 'physical',
  handled_by_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'completed',
  package_type text not null,
  gross_product_amount numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  notes text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by_profile_id uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  constraint sales_sale_number_unique unique (sale_number),
  constraint sales_channel_check check (channel in ('physical')),
  constraint sales_status_check check (status in ('completed', 'cancelled')),
  constraint sales_package_type_check check (package_type in ('buy_1', 'buy_2', 'custom')),
  constraint sales_amounts_check check (
    gross_product_amount >= 0
    and discount_total >= 0
    and total_amount >= 0
  )
);

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

create unique index if not exists sales_idempotency_key_idx
on public.sales(idempotency_key)
where idempotency_key is not null;

create index if not exists sales_created_at_idx
on public.sales(created_at desc);

create index if not exists sales_status_idx
on public.sales(status);

create index if not exists sales_handled_by_profile_id_idx
on public.sales(handled_by_profile_id);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  sku_snapshot text,
  package_label text not null,
  quantity integer not null,
  unit_regular_price numeric(10,2) not null,
  gross_amount numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  final_amount numeric(10,2) not null,
  unit_cost_snapshot numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  constraint sale_items_quantity_check check (quantity > 0),
  constraint sale_items_money_check check (
    unit_regular_price >= 0
    and gross_amount >= 0
    and discount_amount >= 0
    and final_amount >= 0
    and unit_cost_snapshot >= 0
  )
);

create index if not exists sale_items_sale_id_idx
on public.sale_items(sale_id);

create index if not exists sale_items_product_id_idx
on public.sale_items(product_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  payment_method text not null,
  amount_received numeric(10,2) not null,
  reference_number text,
  normalized_reference_number text,
  payment_status text not null default 'paid',
  verified_by_profile_id uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payments_method_check check (payment_method in ('gcash', 'bank_transfer', 'cash', 'other')),
  constraint payments_status_check check (payment_status in ('paid')),
  constraint payments_amount_received_check check (amount_received >= 0),
  constraint payments_reference_required_check check (
    payment_method not in ('gcash', 'bank_transfer')
    or nullif(btrim(coalesce(reference_number, '')), '') is not null
  )
);

create index if not exists payments_sale_id_idx
on public.payments(sale_id);

create unique index if not exists payments_reference_unique_idx
on public.payments(payment_method, normalized_reference_number)
where payment_method in ('gcash', 'bank_transfer')
  and normalized_reference_number is not null;

alter table public.inventory_movements
drop constraint if exists inventory_movements_related_sale_id_fkey,
add constraint inventory_movements_related_sale_id_fkey
foreign key (related_sale_id) references public.sales(id) on delete restrict;

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;

revoke all on public.sales from PUBLIC, anon, authenticated;
revoke all on public.sale_items from PUBLIC, anon, authenticated;
revoke all on public.payments from PUBLIC, anon, authenticated;

drop policy if exists "Admins can read sales" on public.sales;
create policy "Admins can read sales"
on public.sales for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read sale items" on public.sale_items;
create policy "Admins can read sale items"
on public.sale_items for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read payments" on public.payments;
create policy "Admins can read payments"
on public.payments for select
to authenticated
using (public.is_admin());

grant select on public.sales to authenticated;
grant select on public.sale_items to authenticated;
grant select on public.payments to authenticated;

create or replace function public.normalize_payment_reference(p_reference text)
returns text
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select nullif(regexp_replace(lower(btrim(p_reference)), '[^a-z0-9]', '', 'g'), '');
$$;

create or replace function public.record_quick_physical_sale(
  p_product_id uuid,
  p_package_type text,
  p_custom_quantity integer default null,
  p_custom_amount numeric default null,
  p_payment_method text default 'cash',
  p_reference_number text default null,
  p_notes text default null,
  p_actor_profile_id uuid default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_product public.products%rowtype;
  v_existing_sale public.sales%rowtype;
  v_existing_item public.sale_items%rowtype;
  v_existing_payment public.payments%rowtype;
  v_duplicate_payment record;
  v_sale public.sales%rowtype;
  v_item public.sale_items%rowtype;
  v_payment public.payments%rowtype;
  v_movement public.inventory_movements%rowtype;
  v_quantity integer;
  v_single_price numeric(10,2);
  v_bundle_price numeric(10,2);
  v_gross numeric(10,2);
  v_discount numeric(10,2);
  v_final numeric(10,2);
  v_package_label text;
  v_previous integer;
  v_new integer;
  v_payment_method text;
  v_normalized_reference text;
begin
  v_payment_method := lower(btrim(coalesce(p_payment_method, 'cash')));
  if v_payment_method not in ('gcash', 'bank_transfer', 'cash', 'other') then
    raise exception 'Invalid payment method.';
  end if;

  if v_payment_method in ('gcash', 'bank_transfer') then
    v_normalized_reference := public.normalize_payment_reference(p_reference_number);
  end if;

  if p_idempotency_key is not null then
    select *
    into v_existing_sale
    from public.sales
    where idempotency_key = nullif(btrim(p_idempotency_key), '');

    if found then
      select *
      into v_existing_item
      from public.sale_items
      where sale_id = v_existing_sale.id
      limit 1;

      select *
      into v_existing_payment
      from public.payments
      where sale_id = v_existing_sale.id
      limit 1;

      if v_existing_item.id is null
        or v_existing_payment.id is null
        or v_existing_item.product_id <> p_product_id
        or v_existing_sale.package_type <> p_package_type
        or v_existing_payment.payment_method is distinct from v_payment_method
        or v_existing_payment.normalized_reference_number is distinct from v_normalized_reference
        or (p_package_type = 'custom' and (
          v_existing_item.quantity is distinct from p_custom_quantity
          or v_existing_sale.total_amount is distinct from p_custom_amount
        )) then
        raise exception 'Idempotency key was already used for a different sale.';
      end if;

      return public.sale_result_json(v_existing_sale.id);
    end if;
  end if;

  select *
  into v_actor
  from public.profiles
  where id = p_actor_profile_id
    and role = 'admin';

  if not found then
    raise exception 'Quick sale requires an admin profile.';
  end if;

  if p_package_type not in ('buy_1', 'buy_2', 'custom') then
    raise exception 'Invalid sale package.';
  end if;

  if v_payment_method in ('gcash', 'bank_transfer') then
    if v_normalized_reference is null then
      raise exception 'Payment reference is required for this payment method.';
    end if;

    select s.sale_number
    into v_duplicate_payment
    from public.payments p
    join public.sales s on s.id = p.sale_id
    where p.payment_method = v_payment_method
      and p.normalized_reference_number = v_normalized_reference
    limit 1;

    if found then
      raise exception 'Payment reference already exists under Sale #%.' , v_duplicate_payment.sale_number;
    end if;
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found.';
  end if;

  if not v_product.track_inventory then
    raise exception 'Inventory tracking is disabled for this product.';
  end if;

  v_single_price := coalesce(v_product.default_physical_price, v_product.price_single, 0);

  if p_package_type = 'buy_1' then
    v_quantity := 1;
    v_package_label := 'Buy 1';
    v_gross := v_single_price;
    v_discount := 0;
    v_final := v_single_price;
  elsif p_package_type = 'buy_2' then
    v_quantity := 2;
    v_package_label := 'Buy 2';
    v_bundle_price := coalesce(v_product.price_bundle, v_single_price * 2);
    v_gross := v_single_price * 2;
    v_final := v_bundle_price;
    v_discount := greatest(v_gross - v_final, 0);
  else
    if p_custom_quantity is null or p_custom_quantity <= 0 then
      raise exception 'Custom quantity must be a positive whole number.';
    end if;

    if p_custom_amount is null or p_custom_amount < 0 then
      raise exception 'Custom amount must be zero or greater.';
    end if;

    v_quantity := p_custom_quantity;
    v_package_label := 'Custom';
    v_gross := v_single_price * v_quantity;
    v_final := p_custom_amount;
    v_discount := greatest(v_gross - v_final, 0);
  end if;

  if v_product.current_stock < v_quantity then
    raise exception 'Insufficient stock for this sale.';
  end if;

  v_previous := v_product.current_stock;
  v_new := v_previous - v_quantity;

  insert into public.sales (
    channel,
    handled_by_profile_id,
    status,
    package_type,
    gross_product_amount,
    discount_total,
    total_amount,
    notes,
    idempotency_key
  )
  values (
    'physical',
    p_actor_profile_id,
    'completed',
    p_package_type,
    v_gross,
    v_discount,
    v_final,
    nullif(btrim(coalesce(p_notes, '')), ''),
    nullif(btrim(coalesce(p_idempotency_key, '')), '')
  )
  returning * into v_sale;

  insert into public.sale_items (
    sale_id,
    product_id,
    product_name_snapshot,
    sku_snapshot,
    package_label,
    quantity,
    unit_regular_price,
    gross_amount,
    discount_amount,
    final_amount,
    unit_cost_snapshot
  )
  values (
    v_sale.id,
    v_product.id,
    v_product.name,
    v_product.sku,
    v_package_label,
    v_quantity,
    v_single_price,
    v_gross,
    v_discount,
    v_final,
    v_product.current_unit_cost
  )
  returning * into v_item;

  insert into public.payments (
    sale_id,
    payment_method,
    amount_received,
    reference_number,
    normalized_reference_number,
    payment_status,
    verified_by_profile_id,
    verified_at
  )
  values (
    v_sale.id,
    v_payment_method,
    v_final,
    nullif(btrim(coalesce(p_reference_number, '')), ''),
    v_normalized_reference,
    'paid',
    p_actor_profile_id,
    now()
  )
  returning * into v_payment;

  update public.products
  set current_stock = v_new
  where id = v_product.id;

  insert into public.inventory_movements (
    product_id,
    movement_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    notes,
    actor_profile_id,
    related_sale_id,
    reference_id,
    idempotency_key
  )
  values (
    v_product.id,
    'sale_commit',
    -v_quantity,
    v_previous,
    v_new,
    'Quick physical sale',
    nullif(btrim(coalesce(p_notes, '')), ''),
    p_actor_profile_id,
    v_sale.id,
    v_sale.sale_number,
    case
      when p_idempotency_key is null then null
      else nullif(btrim(p_idempotency_key), '') || ':inventory'
    end
  )
  returning * into v_movement;

  return public.sale_result_json(v_sale.id);
exception
  when unique_violation then
    if v_normalized_reference is not null then
      select s.sale_number
      into v_duplicate_payment
      from public.payments p
      join public.sales s on s.id = p.sale_id
      where p.payment_method = v_payment_method
        and p.normalized_reference_number = v_normalized_reference
      limit 1;

      if found then
        raise exception 'Payment reference already exists under Sale #%.' , v_duplicate_payment.sale_number;
      end if;
    end if;

    if p_idempotency_key is not null then
      select *
      into v_existing_sale
      from public.sales
      where idempotency_key = nullif(btrim(p_idempotency_key), '');

      if found then
        select *
        into v_existing_item
        from public.sale_items
        where sale_id = v_existing_sale.id
        limit 1;

        select *
        into v_existing_payment
        from public.payments
        where sale_id = v_existing_sale.id
        limit 1;

        if v_existing_item.id is null
          or v_existing_payment.id is null
          or v_existing_item.product_id <> p_product_id
          or v_existing_sale.package_type <> p_package_type
          or v_existing_payment.payment_method is distinct from v_payment_method
          or v_existing_payment.normalized_reference_number is distinct from v_normalized_reference
          or (p_package_type = 'custom' and (
            v_existing_item.quantity is distinct from p_custom_quantity
            or v_existing_sale.total_amount is distinct from p_custom_amount
          )) then
          raise exception 'Idempotency key was already used for a different sale.';
        end if;

        return public.sale_result_json(v_existing_sale.id);
      end if;
    end if;
    raise;
end;
$$;

create or replace function public.cancel_quick_sale(
  p_sale_id uuid,
  p_reason text default null,
  p_actor_profile_id uuid default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_sale public.sales%rowtype;
  v_item public.sale_items%rowtype;
  v_product public.products%rowtype;
  v_existing_restore public.inventory_movements%rowtype;
  v_previous integer;
  v_new integer;
begin
  select *
  into v_actor
  from public.profiles
  where id = p_actor_profile_id
    and role = 'admin';

  if not found then
    raise exception 'Sale cancellation requires an admin profile.';
  end if;

  select *
  into v_sale
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Sale not found.';
  end if;

  if v_sale.status = 'cancelled' then
    return public.sale_result_json(v_sale.id);
  end if;

  select *
  into v_existing_restore
  from public.inventory_movements
  where related_sale_id = v_sale.id
    and movement_type = 'sale_cancel_restore'
  limit 1;

  if found then
    update public.sales
    set
      status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      cancelled_by_profile_id = coalesce(cancelled_by_profile_id, p_actor_profile_id),
      cancellation_reason = coalesce(cancellation_reason, nullif(btrim(coalesce(p_reason, '')), ''))
    where id = v_sale.id;

    return public.sale_result_json(v_sale.id);
  end if;

  select *
  into v_item
  from public.sale_items
  where sale_id = v_sale.id
  limit 1;

  if not found then
    raise exception 'Sale item not found.';
  end if;

  select *
  into v_product
  from public.products
  where id = v_item.product_id
  for update;

  if not found then
    raise exception 'Product not found.';
  end if;

  v_previous := v_product.current_stock;
  v_new := v_previous + v_item.quantity;

  update public.products
  set current_stock = v_new
  where id = v_product.id;

  insert into public.inventory_movements (
    product_id,
    movement_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    notes,
    actor_profile_id,
    related_sale_id,
    reference_id,
    idempotency_key
  )
  values (
    v_product.id,
    'sale_cancel_restore',
    v_item.quantity,
    v_previous,
    v_new,
    'Sale cancellation',
    nullif(btrim(coalesce(p_reason, '')), ''),
    p_actor_profile_id,
    v_sale.id,
    v_sale.sale_number,
    case
      when p_idempotency_key is null then null
      else nullif(btrim(p_idempotency_key), '') || ':inventory'
    end
  );

  update public.sales
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by_profile_id = p_actor_profile_id,
    cancellation_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = v_sale.id;

  return public.sale_result_json(v_sale.id);
end;
$$;

create or replace function public.sale_result_json(p_sale_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'saleId', s.id,
    'saleNumber', s.sale_number,
    'status', s.status,
    'productId', si.product_id,
    'productName', si.product_name_snapshot,
    'packageLabel', si.package_label,
    'quantity', si.quantity,
    'grossAmount', si.gross_amount,
    'discountAmount', si.discount_amount,
    'finalAmount', si.final_amount,
    'unitCostSnapshot', si.unit_cost_snapshot,
    'paymentMethod', p.payment_method,
    'paymentReference', p.reference_number,
    'previousStock', im.previous_quantity,
    'newStock', im.new_quantity,
    'movementId', im.id,
    'createdAt', s.created_at
  )
  from public.sales s
  join public.sale_items si on si.sale_id = s.id
  join public.payments p on p.sale_id = s.id
  left join lateral (
    select *
    from public.inventory_movements movement
    where movement.related_sale_id = s.id
      and movement.movement_type in ('sale_commit', 'sale_cancel_restore')
    order by movement.created_at desc
    limit 1
  ) im on true
  where s.id = p_sale_id
  limit 1;
$$;

revoke all on function public.normalize_payment_reference(text) from public;
revoke all on function public.sale_result_json(uuid) from public;
revoke all on function public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text) from public;
revoke all on function public.cancel_quick_sale(uuid, text, uuid, text) from public;

grant execute on function public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text) to service_role;
grant execute on function public.cancel_quick_sale(uuid, text, uuid, text) to service_role;
grant execute on function public.sale_result_json(uuid) to service_role;

grant select on public.sales to service_role;
grant select on public.sale_items to service_role;
grant select on public.payments to service_role;
grant insert, update, delete on public.sales to service_role;
grant insert, update, delete on public.sale_items to service_role;
grant insert, update, delete on public.payments to service_role;
grant usage, select on sequence public.sales_sale_number_seq to service_role;

commit;
