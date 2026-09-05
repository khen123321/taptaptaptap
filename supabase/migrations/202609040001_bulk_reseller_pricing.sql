begin;

alter table public.products
add column if not exists bulk_enabled boolean not null default false,
add column if not exists bulk_tier_1_min integer not null default 10,
add column if not exists bulk_tier_1_max integer not null default 24,
add column if not exists bulk_tier_1_unit_price numeric(10,2),
add column if not exists bulk_tier_2_min integer not null default 25,
add column if not exists bulk_tier_2_unit_price numeric(10,2);

alter table public.products
drop constraint if exists products_bulk_tiers_check,
add constraint products_bulk_tiers_check check (
  bulk_tier_1_min > 0
  and bulk_tier_1_max >= bulk_tier_1_min
  and bulk_tier_2_min > bulk_tier_1_max
  and (bulk_tier_1_unit_price is null or bulk_tier_1_unit_price >= 0)
  and (bulk_tier_2_unit_price is null or bulk_tier_2_unit_price >= 0)
  and (
    not bulk_enabled
    or (
      bulk_tier_1_unit_price is not null
      and bulk_tier_2_unit_price is not null
    )
  )
);

update public.products
set
  price_single = 699,
  price_bundle = 1199,
  bundle_savings = 199,
  bulk_enabled = false
where slug = 'instagram-nfc-keychain';

update public.products
set
  price_single = 899,
  price_bundle = 1499,
  bundle_savings = 299,
  bulk_enabled = true,
  bulk_tier_1_min = 10,
  bulk_tier_1_max = 24,
  bulk_tier_1_unit_price = 599,
  bulk_tier_2_min = 25,
  bulk_tier_2_unit_price = 499
where slug in ('google-review-nfc-sign', 'facebook-follow-nfc-sign');

alter table public.sales
drop constraint if exists sales_status_check,
add constraint sales_status_check check (status in ('pending', 'completed', 'cancelled'));

alter table public.sales
drop constraint if exists sales_package_type_check,
add constraint sales_package_type_check check (package_type in ('buy_1', 'buy_2', 'bulk', 'custom'));

alter table public.sales
add column if not exists completed_at timestamptz;

update public.sales
set completed_at = coalesce(completed_at, created_at)
where status = 'completed';

create index if not exists sales_completed_at_idx
on public.sales(completed_at desc);

alter table public.payments
drop constraint if exists payments_status_check,
add constraint payments_status_check check (payment_status in ('pending', 'paid'));

alter table public.payments
drop constraint if exists payments_reference_required_check;

alter table public.sale_items
add column if not exists bulk_unit_price numeric(10,2),
add column if not exists pricing_tier_label text;

alter table public.sale_items
drop constraint if exists sale_items_bulk_price_check,
add constraint sale_items_bulk_price_check check (
  bulk_unit_price is null or bulk_unit_price >= 0
);

create table if not exists public.sale_expenses (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  expense_type text not null,
  amount numeric(10,2) not null,
  description text,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint sale_expenses_type_check check (
    expense_type in (
      'gas_transportation',
      'shipping_delivery',
      'packaging',
      'printing_customization',
      'commission',
      'other'
    )
  ),
  constraint sale_expenses_amount_check check (amount >= 0)
);

create index if not exists sale_expenses_sale_id_idx
on public.sale_expenses(sale_id);

create index if not exists sale_expenses_created_at_idx
on public.sale_expenses(created_at desc);

alter table public.sale_expenses enable row level security;

revoke all on public.sale_expenses from PUBLIC, anon, authenticated;

drop policy if exists "Admins can read sale expenses" on public.sale_expenses;
create policy "Admins can read sale expenses"
on public.sale_expenses for select
to authenticated
using (public.is_admin());

grant select on public.sale_expenses to authenticated;
grant select, insert, update, delete on public.sale_expenses to service_role;

drop function if exists public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text);
drop function if exists public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text, text);
drop function if exists public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text, text, jsonb);

create or replace function public.record_quick_physical_sale(
  p_product_id uuid,
  p_package_type text,
  p_custom_quantity integer default null,
  p_custom_amount numeric default null,
  p_payment_method text default 'cash',
  p_reference_number text default null,
  p_notes text default null,
  p_actor_profile_id uuid default null,
  p_idempotency_key text default null,
  p_sale_status text default 'completed',
  p_sale_expenses jsonb default '[]'::jsonb
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
  v_bulk_unit_price numeric(10,2);
  v_gross numeric(10,2);
  v_discount numeric(10,2);
  v_final numeric(10,2);
  v_package_label text;
  v_pricing_tier_label text;
  v_previous integer;
  v_new integer;
  v_payment_method text;
  v_normalized_reference text;
  v_sale_status text;
  v_requested_package text;
  v_effective_package text;
  v_expense jsonb;
  v_expense_type text;
  v_expense_amount numeric(10,2);
  v_expense_description text;
begin
  v_payment_method := lower(btrim(coalesce(p_payment_method, 'cash')));
  if v_payment_method not in ('gcash', 'bank_transfer', 'cash', 'other') then
    raise exception 'Invalid payment method.';
  end if;

  v_sale_status := lower(btrim(coalesce(p_sale_status, 'completed')));
  if v_sale_status not in ('pending', 'completed') then
    raise exception 'Invalid sale status.';
  end if;

  v_requested_package := lower(btrim(coalesce(p_package_type, 'buy_1')));
  if v_requested_package not in ('buy_1', 'buy_2', 'bulk', 'custom') then
    raise exception 'Invalid sale package.';
  end if;

  v_effective_package := v_requested_package;
  if v_requested_package = 'bulk' and p_custom_quantity = 1 then
    v_effective_package := 'buy_1';
  elsif v_requested_package = 'bulk' and p_custom_quantity = 2 then
    v_effective_package := 'buy_2';
  end if;

  if v_payment_method in ('gcash', 'bank_transfer') and nullif(btrim(coalesce(p_reference_number, '')), '') is not null then
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
        or v_existing_sale.package_type <> v_effective_package
        or v_existing_sale.status <> v_sale_status
        or v_existing_payment.payment_method is distinct from v_payment_method
        or v_existing_payment.normalized_reference_number is distinct from v_normalized_reference
        or ((v_effective_package = 'custom' or v_effective_package = 'bulk') and (
          v_existing_item.quantity is distinct from p_custom_quantity
          or (v_effective_package = 'custom' and v_existing_sale.total_amount is distinct from p_custom_amount)
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

  if p_sale_expenses is not null and jsonb_typeof(p_sale_expenses) <> 'array' then
    raise exception 'Sale deductions must be an array.';
  end if;

  if v_payment_method in ('gcash', 'bank_transfer') and v_normalized_reference is not null then
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

  if v_effective_package = 'buy_1' then
    v_quantity := 1;
    v_package_label := 'Buy 1';
    v_gross := v_single_price;
    v_discount := 0;
    v_final := v_single_price;
  elsif v_effective_package = 'buy_2' then
    v_quantity := 2;
    v_package_label := 'Buy 2';
    v_bundle_price := coalesce(v_product.price_bundle, v_single_price * 2);
    v_gross := v_single_price * 2;
    v_final := v_bundle_price;
    v_discount := greatest(v_gross - v_final, 0);
  elsif v_effective_package = 'bulk' then
    if not v_product.bulk_enabled then
      raise exception 'Bulk pricing is not enabled for this product.';
    end if;

    if p_custom_quantity is null or p_custom_quantity <= 0 then
      raise exception 'Bulk quantity must be a positive whole number.';
    end if;

    if p_custom_quantity between 3 and 9 then
      raise exception 'Bulk pricing starts at 10 units.';
    end if;

    if p_custom_quantity < v_product.bulk_tier_1_min then
      raise exception 'Bulk pricing starts at 10 units.';
    end if;

    v_quantity := p_custom_quantity;
    v_gross := v_single_price * v_quantity;
    v_package_label := 'Bulk / Reseller';

    if v_quantity >= v_product.bulk_tier_2_min then
      v_bulk_unit_price := v_product.bulk_tier_2_unit_price;
      v_pricing_tier_label := '25+ Cards';
    elsif v_quantity between v_product.bulk_tier_1_min and v_product.bulk_tier_1_max then
      v_bulk_unit_price := v_product.bulk_tier_1_unit_price;
      v_pricing_tier_label := '10-24 Cards';
    else
      raise exception 'Bulk pricing starts at 10 units.';
    end if;

    if v_bulk_unit_price is null then
      raise exception 'Bulk pricing is not fully configured for this product.';
    end if;

    v_final := v_quantity * v_bulk_unit_price;
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

  v_previous := v_product.current_stock;
  v_new := v_previous;

  if v_sale_status = 'completed' then
    if v_product.current_stock < v_quantity then
      raise exception 'Insufficient stock for this sale.';
    end if;

    v_new := v_previous - v_quantity;
  end if;

  insert into public.sales (
    channel,
    handled_by_profile_id,
    status,
    package_type,
    gross_product_amount,
    discount_total,
    total_amount,
    notes,
    idempotency_key,
    completed_at
  )
  values (
    'physical',
    p_actor_profile_id,
    v_sale_status,
    v_effective_package,
    v_gross,
    v_discount,
    v_final,
    nullif(btrim(coalesce(p_notes, '')), ''),
    nullif(btrim(coalesce(p_idempotency_key, '')), ''),
    case when v_sale_status = 'completed' then now() else null end
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
    bulk_unit_price,
    pricing_tier_label,
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
    v_bulk_unit_price,
    v_pricing_tier_label,
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
    case when v_sale_status = 'completed' then 'paid' else 'pending' end,
    case when v_sale_status = 'completed' then p_actor_profile_id else null end,
    case when v_sale_status = 'completed' then now() else null end
  )
  returning * into v_payment;

  for v_expense in
    select value from jsonb_array_elements(coalesce(p_sale_expenses, '[]'::jsonb))
  loop
    v_expense_type := lower(btrim(coalesce(v_expense ->> 'expenseType', v_expense ->> 'expense_type', '')));
    v_expense_description := nullif(btrim(coalesce(v_expense ->> 'description', '')), '');

    if v_expense_type not in (
      'gas_transportation',
      'shipping_delivery',
      'packaging',
      'printing_customization',
      'commission',
      'other'
    ) then
      raise exception 'Invalid sale deduction type.';
    end if;

    if nullif(btrim(coalesce(v_expense ->> 'amount', '')), '') is null then
      raise exception 'Sale deduction amount is required.';
    end if;

    v_expense_amount := (v_expense ->> 'amount')::numeric;
    if v_expense_amount < 0 then
      raise exception 'Sale deduction amount must be zero or greater.';
    end if;

    insert into public.sale_expenses (
      sale_id,
      expense_type,
      amount,
      description,
      created_by_profile_id
    )
    values (
      v_sale.id,
      v_expense_type,
      v_expense_amount,
      v_expense_description,
      p_actor_profile_id
    );
  end loop;

  if v_sale_status = 'completed' then
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
  end if;

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
          or v_existing_sale.package_type <> v_effective_package
          or v_existing_sale.status <> v_sale_status
          or v_existing_payment.payment_method is distinct from v_payment_method
          or v_existing_payment.normalized_reference_number is distinct from v_normalized_reference
          or ((v_effective_package = 'custom' or v_effective_package = 'bulk') and (
            v_existing_item.quantity is distinct from p_custom_quantity
            or (v_effective_package = 'custom' and v_existing_sale.total_amount is distinct from p_custom_amount)
          )) then
          raise exception 'Idempotency key was already used for a different sale.';
        end if;

        return public.sale_result_json(v_existing_sale.id);
      end if;
    end if;
    raise;
end;
$$;

create or replace function public.complete_pending_quick_sale(
  p_sale_id uuid,
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
  v_existing_commit public.inventory_movements%rowtype;
  v_previous integer;
  v_new integer;
begin
  select *
  into v_actor
  from public.profiles
  where id = p_actor_profile_id
    and role = 'admin';

  if not found then
    raise exception 'Sale completion requires an admin profile.';
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
    raise exception 'Cancelled sales cannot be marked sold.';
  end if;

  if v_sale.status = 'completed' then
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

  if not v_product.track_inventory then
    raise exception 'Inventory tracking is disabled for this product.';
  end if;

  select *
  into v_existing_commit
  from public.inventory_movements
  where related_sale_id = v_sale.id
    and movement_type = 'sale_commit'
  limit 1;

  if found then
    update public.sales
    set
      status = 'completed',
      completed_at = coalesce(completed_at, now())
    where id = v_sale.id;

    update public.payments
    set
      payment_status = 'paid',
      verified_by_profile_id = coalesce(verified_by_profile_id, p_actor_profile_id),
      verified_at = coalesce(verified_at, now())
    where sale_id = v_sale.id;

    return public.sale_result_json(v_sale.id);
  end if;

  if v_product.current_stock < v_item.quantity then
    raise exception 'Insufficient stock for this sale.';
  end if;

  v_previous := v_product.current_stock;
  v_new := v_previous - v_item.quantity;

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
    -v_item.quantity,
    v_previous,
    v_new,
    'Quick physical sale',
    v_sale.notes,
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
    status = 'completed',
    completed_at = coalesce(completed_at, now())
  where id = v_sale.id;

  update public.payments
  set
    payment_status = 'paid',
    verified_by_profile_id = coalesce(verified_by_profile_id, p_actor_profile_id),
    verified_at = coalesce(verified_at, now())
  where sale_id = v_sale.id;

  return public.sale_result_json(v_sale.id);
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
  v_existing_commit public.inventory_movements%rowtype;
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
  into v_item
  from public.sale_items
  where sale_id = v_sale.id
  limit 1;

  if not found then
    raise exception 'Sale item not found.';
  end if;

  select *
  into v_existing_commit
  from public.inventory_movements
  where related_sale_id = v_sale.id
    and movement_type = 'sale_commit'
  limit 1;

  if not found then
    update public.sales
    set
      status = 'cancelled',
      cancelled_at = now(),
      cancelled_by_profile_id = p_actor_profile_id,
      cancellation_reason = nullif(btrim(coalesce(p_reason, '')), '')
    where id = v_sale.id;

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
    'pricingTierLabel', si.pricing_tier_label,
    'quantity', si.quantity,
    'regularUnitPrice', si.unit_regular_price,
    'bulkUnitPrice', si.bulk_unit_price,
    'grossAmount', si.gross_amount,
    'discountAmount', si.discount_amount,
    'finalAmount', si.final_amount,
    'unitCostSnapshot', si.unit_cost_snapshot,
    'paymentMethod', p.payment_method,
    'paymentReference', p.reference_number,
    'previousStock', im.previous_quantity,
    'newStock', im.new_quantity,
    'movementId', im.id,
    'totalDirectDeductions', expense_summary.total_direct_deductions,
    'netAfterDeductions', si.final_amount - expense_summary.total_direct_deductions,
    'expenses', expense_summary.expenses,
    'createdAt', s.created_at,
    'completedAt', s.completed_at
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
  left join lateral (
    select
      coalesce(sum(expense.amount), 0) as total_direct_deductions,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', expense.id,
            'sale_id', expense.sale_id,
            'expense_type', expense.expense_type,
            'amount', expense.amount,
            'description', expense.description,
            'created_by_profile_id', expense.created_by_profile_id,
            'created_at', expense.created_at
          )
          order by expense.created_at asc
        ) filter (where expense.id is not null),
        '[]'::jsonb
      ) as expenses
    from public.sale_expenses expense
    where expense.sale_id = s.id
  ) expense_summary on true
  where s.id = p_sale_id
  limit 1;
$$;

revoke all on function public.normalize_payment_reference(text) from public;
revoke all on function public.sale_result_json(uuid) from public;
revoke all on function public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text, text, jsonb) from public;
revoke all on function public.complete_pending_quick_sale(uuid, uuid, text) from public;
revoke all on function public.cancel_quick_sale(uuid, text, uuid, text) from public;

grant execute on function public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text, text, jsonb) to service_role;
grant execute on function public.complete_pending_quick_sale(uuid, uuid, text) to service_role;
grant execute on function public.cancel_quick_sale(uuid, text, uuid, text) to service_role;
grant execute on function public.sale_result_json(uuid) to service_role;

commit;
