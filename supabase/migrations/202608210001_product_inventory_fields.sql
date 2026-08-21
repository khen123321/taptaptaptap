begin;

alter table public.products
add column if not exists sku text,
add column if not exists current_stock integer not null default 0,
add column if not exists current_unit_cost numeric(10,2) not null default 0,
add column if not exists low_stock_threshold integer not null default 5,
add column if not exists track_inventory boolean not null default true,
add column if not exists default_online_price numeric(10,2),
add column if not exists default_physical_price numeric(10,2);

update public.products
set
  sku = nullif(btrim(sku), ''),
  default_online_price = coalesce(default_online_price, price_single),
  default_physical_price = coalesce(default_physical_price, price_single)
where sku is not null
   or default_online_price is null
   or default_physical_price is null;

alter table public.products
drop constraint if exists products_current_stock_check,
add constraint products_current_stock_check check (current_stock >= 0);

alter table public.products
drop constraint if exists products_current_unit_cost_check,
add constraint products_current_unit_cost_check check (current_unit_cost >= 0);

alter table public.products
drop constraint if exists products_low_stock_threshold_check,
add constraint products_low_stock_threshold_check check (low_stock_threshold >= 0);

alter table public.products
drop constraint if exists products_default_online_price_check,
add constraint products_default_online_price_check check (default_online_price is null or default_online_price >= 0);

alter table public.products
drop constraint if exists products_default_physical_price_check,
add constraint products_default_physical_price_check check (default_physical_price is null or default_physical_price >= 0);

alter table public.products
drop constraint if exists products_sku_not_blank_check,
add constraint products_sku_not_blank_check check (sku is null or btrim(sku) <> '');

create unique index if not exists products_sku_unique_idx
on public.products (lower(btrim(sku)))
where sku is not null;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null,
  quantity_change integer not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  reason text,
  notes text,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  related_sale_id uuid,
  reference_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint inventory_movements_quantity_change_check check (quantity_change <> 0),
  constraint inventory_movements_previous_quantity_check check (previous_quantity >= 0),
  constraint inventory_movements_new_quantity_check check (new_quantity >= 0),
  constraint inventory_movements_type_check check (
    movement_type in (
      'initial_stock',
      'restock',
      'manual_adjustment',
      'damage',
      'lost',
      'promotional_giveaway',
      'sample_unit',
      'inventory_correction',
      'returned_item',
      'other',
      'sale_commit',
      'sale_cancel_restore',
      'refund_restore'
    )
  )
);

create index if not exists inventory_movements_product_id_idx
on public.inventory_movements(product_id);

create index if not exists inventory_movements_actor_profile_id_idx
on public.inventory_movements(actor_profile_id);

create index if not exists inventory_movements_created_at_idx
on public.inventory_movements(created_at desc);

create index if not exists inventory_movements_movement_type_idx
on public.inventory_movements(movement_type);

create unique index if not exists inventory_movements_idempotency_key_idx
on public.inventory_movements(idempotency_key)
where idempotency_key is not null;

create table if not exists public.inventory_receipts (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null unique references public.inventory_movements(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity_received integer not null,
  unit_cost numeric(10,2) not null,
  supplier text,
  freight_cost numeric(10,2),
  received_at date not null default current_date,
  notes text,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_receipts_quantity_received_check check (quantity_received > 0),
  constraint inventory_receipts_unit_cost_check check (unit_cost >= 0),
  constraint inventory_receipts_freight_cost_check check (freight_cost is null or freight_cost >= 0)
);

create index if not exists inventory_receipts_product_id_idx
on public.inventory_receipts(product_id);

create index if not exists inventory_receipts_received_at_idx
on public.inventory_receipts(received_at desc);

alter table public.inventory_movements enable row level security;
alter table public.inventory_receipts enable row level security;

revoke insert, update, delete on public.inventory_movements from anon, authenticated;
revoke insert, update, delete on public.inventory_receipts from anon, authenticated;

drop policy if exists "Admins can read inventory movements" on public.inventory_movements;
create policy "Admins can read inventory movements"
on public.inventory_movements for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read inventory receipts" on public.inventory_receipts;
create policy "Admins can read inventory receipts"
on public.inventory_receipts for select
to authenticated
using (public.is_admin());

create or replace function public.adjust_product_inventory(
  p_product_id uuid,
  p_quantity_change integer,
  p_movement_type text,
  p_reason text default null,
  p_notes text default null,
  p_actor_profile_id uuid default null,
  p_idempotency_key text default null,
  p_unit_cost numeric default null,
  p_supplier text default null,
  p_freight_cost numeric default null,
  p_received_at date default null,
  p_update_unit_cost boolean default false
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_product public.products%rowtype;
  v_previous integer;
  v_new integer;
  v_movement public.inventory_movements%rowtype;
begin
  if p_idempotency_key is not null then
    select *
    into v_movement
    from public.inventory_movements
    where idempotency_key = p_idempotency_key;

    if found then
      if v_movement.product_id <> p_product_id
        or v_movement.quantity_change <> p_quantity_change
        or v_movement.movement_type <> p_movement_type then
        raise exception 'Idempotency key was already used for a different inventory adjustment.';
      end if;

      return v_movement;
    end if;
  end if;

  select *
  into v_actor
  from public.profiles
  where id = p_actor_profile_id
    and role = 'admin';

  if not found then
    raise exception 'Inventory adjustment requires an admin profile.';
  end if;

  if auth.role() <> 'service_role' and v_actor.user_id <> auth.uid() then
    raise exception 'Inventory adjustment actor does not match the authenticated user.';
  end if;

  if p_quantity_change = 0 then
    raise exception 'Quantity change must not be zero.';
  end if;

  if p_movement_type not in (
    'initial_stock',
    'restock',
    'manual_adjustment',
    'damage',
    'lost',
    'promotional_giveaway',
    'sample_unit',
    'inventory_correction',
    'returned_item',
    'other',
    'sale_commit',
    'sale_cancel_restore',
    'refund_restore'
  ) then
    raise exception 'Invalid inventory movement type.';
  end if;

  if p_movement_type in ('initial_stock', 'restock', 'returned_item') and p_quantity_change < 0 then
    raise exception 'This movement type must add stock.';
  end if;

  if p_movement_type in ('damage', 'lost', 'promotional_giveaway', 'sample_unit') and p_quantity_change > 0 then
    raise exception 'This movement type must remove stock.';
  end if;

  if p_unit_cost is not null and p_unit_cost < 0 then
    raise exception 'Unit cost cannot be negative.';
  end if;

  if p_freight_cost is not null and p_freight_cost < 0 then
    raise exception 'Freight cost cannot be negative.';
  end if;

  begin
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

    v_previous := v_product.current_stock;
    v_new := v_previous + p_quantity_change;

    if v_new < 0 then
      raise exception 'Insufficient stock for this inventory adjustment.';
    end if;

    update public.products
    set
      current_stock = v_new,
      current_unit_cost = case
        when p_update_unit_cost and p_unit_cost is not null then p_unit_cost
        else current_unit_cost
      end
    where id = p_product_id;

    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason,
      notes,
      actor_profile_id,
      idempotency_key
    )
    values (
      p_product_id,
      p_movement_type,
      p_quantity_change,
      v_previous,
      v_new,
      nullif(btrim(coalesce(p_reason, '')), ''),
      nullif(btrim(coalesce(p_notes, '')), ''),
      p_actor_profile_id,
      nullif(btrim(coalesce(p_idempotency_key, '')), '')
    )
    returning * into v_movement;

    if p_movement_type in ('initial_stock', 'restock') then
      if p_unit_cost is null then
        raise exception 'Unit cost is required for restocking.';
      end if;

      insert into public.inventory_receipts (
        movement_id,
        product_id,
        quantity_received,
        unit_cost,
        supplier,
        freight_cost,
        received_at,
        notes,
        actor_profile_id
      )
      values (
        v_movement.id,
        p_product_id,
        p_quantity_change,
        p_unit_cost,
        nullif(btrim(coalesce(p_supplier, '')), ''),
        p_freight_cost,
        coalesce(p_received_at, current_date),
        nullif(btrim(coalesce(p_notes, '')), ''),
        p_actor_profile_id
      );
    end if;

    return v_movement;
  exception
    when unique_violation then
      if p_idempotency_key is not null then
        select *
        into v_movement
        from public.inventory_movements
        where idempotency_key = p_idempotency_key;

        if found then
          if v_movement.product_id <> p_product_id
            or v_movement.quantity_change <> p_quantity_change
            or v_movement.movement_type <> p_movement_type then
            raise exception 'Idempotency key was already used for a different inventory adjustment.';
          end if;

          return v_movement;
        end if;
      end if;
      raise;
  end;
end;
$$;

revoke all on function public.adjust_product_inventory(
  uuid,
  integer,
  text,
  text,
  text,
  uuid,
  text,
  numeric,
  text,
  numeric,
  date,
  boolean
) from public;

grant execute on function public.adjust_product_inventory(
  uuid,
  integer,
  text,
  text,
  text,
  uuid,
  text,
  numeric,
  text,
  numeric,
  date,
  boolean
) to service_role;

revoke select on public.products from anon, authenticated;
revoke insert, update on public.products from anon, authenticated;
grant select (
  id,
  name,
  slug,
  short_description,
  description,
  product_type,
  category,
  price_single,
  price_bundle,
  bundle_savings,
  card_image_url,
  detail_image_url,
  mockup_image_url,
  included_features,
  cta_label,
  cta_href,
  status,
  display_order,
  created_at,
  updated_at
) on public.products to anon, authenticated;
grant insert (
  name,
  slug,
  short_description,
  description,
  product_type,
  category,
  price_single,
  price_bundle,
  bundle_savings,
  card_image_url,
  detail_image_url,
  mockup_image_url,
  included_features,
  cta_label,
  cta_href,
  status,
  display_order,
  sku,
  current_unit_cost,
  low_stock_threshold,
  track_inventory,
  default_online_price,
  default_physical_price
) on public.products to authenticated;
grant update (
  name,
  slug,
  short_description,
  description,
  product_type,
  category,
  price_single,
  price_bundle,
  bundle_savings,
  card_image_url,
  detail_image_url,
  mockup_image_url,
  included_features,
  cta_label,
  cta_href,
  status,
  display_order,
  sku,
  current_unit_cost,
  low_stock_threshold,
  track_inventory,
  default_online_price,
  default_physical_price
) on public.products to authenticated;
grant select on public.products to service_role;

commit;
