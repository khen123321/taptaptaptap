begin;

alter table public.inventory_movements
drop constraint if exists inventory_movements_type_check,
add constraint inventory_movements_type_check check (
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
    'sale_delete_restore',
    'sales_reset_restore',
    'refund_restore'
  )
);

alter table public.inventory_movements
drop constraint if exists inventory_movements_related_sale_id_fkey,
add constraint inventory_movements_related_sale_id_fkey
foreign key (related_sale_id) references public.sales(id) on delete set null;

create or replace function public.restore_sale_inventory(
  p_sale_id uuid,
  p_movement_type text,
  p_reason text,
  p_notes text,
  p_actor_profile_id uuid,
  p_idempotency_key text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sale public.sales%rowtype;
  v_item public.sale_items%rowtype;
  v_product public.products%rowtype;
  v_previous integer;
  v_new integer;
begin
  if p_movement_type not in ('sale_cancel_restore', 'sale_delete_restore', 'sales_reset_restore') then
    raise exception 'Invalid inventory restore type.';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found.'; end if;

  if not exists (
    select 1
    from public.inventory_movements
    where related_sale_id = v_sale.id
      and movement_type = 'sale_commit'
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.inventory_movements
    where related_sale_id = v_sale.id
      and movement_type in ('sale_cancel_restore', 'sale_delete_restore', 'sales_reset_restore')
  ) then
    return;
  end if;

  perform public.lock_products_for_sale_items((
    select coalesce(jsonb_agg(jsonb_build_object('productId', product_id)), '[]'::jsonb)
    from public.sale_items
    where sale_id = v_sale.id
  ));

  for v_item in
    select * from public.sale_items where sale_id = v_sale.id order by product_id, created_at, id
  loop
    select * into v_product from public.products where id = v_item.product_id for update;
    if not found then raise exception 'Product not found.'; end if;

    v_previous := v_product.current_stock;
    v_new := v_previous + v_item.quantity;

    update public.products set current_stock = v_new where id = v_product.id;

    insert into public.inventory_movements (
      product_id, movement_type, quantity_change, previous_quantity, new_quantity,
      reason, notes, actor_profile_id, related_sale_id, reference_id, idempotency_key
    )
    values (
      v_product.id, p_movement_type, v_item.quantity, v_previous, v_new,
      p_reason, nullif(btrim(coalesce(p_notes, '')), ''), p_actor_profile_id, v_sale.id, v_sale.sale_number,
      case when p_idempotency_key is null then null else nullif(btrim(p_idempotency_key), '') || ':inventory:' || v_item.id::text end
    );
  end loop;
end;
$$;

create or replace function public.reset_all_sales_data(
  p_actor_profile_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_sale public.sales%rowtype;
  v_reset_sales integer := 0;
  v_reset_sale_items integer := 0;
  v_reset_payments integer := 0;
  v_reset_sale_expenses integer := 0;
  v_reset_sale_locations integer := 0;
  v_restored_units integer := 0;
  v_restore_movements integer := 0;
begin
  select * into v_actor from public.profiles where id = p_actor_profile_id and role = 'admin';
  if not found then raise exception 'Sales reset requires an admin profile.'; end if;

  perform pg_advisory_xact_lock(hashtext('taptaptap_reset_all_sales_data'));

  select count(*) into v_reset_sales from public.sales;
  select count(*) into v_reset_sale_items from public.sale_items;
  select count(*) into v_reset_payments from public.payments;
  select count(*) into v_reset_sale_expenses from public.sale_expenses;
  select count(*) into v_reset_sale_locations from public.sale_locations;

  for v_sale in
    select s.*
    from public.sales s
    where exists (
      select 1
      from public.inventory_movements im
      where im.related_sale_id = s.id
        and im.movement_type = 'sale_commit'
    )
    and not exists (
      select 1
      from public.inventory_movements im
      where im.related_sale_id = s.id
        and im.movement_type in ('sale_cancel_restore', 'sale_delete_restore', 'sales_reset_restore')
    )
    order by s.created_at, s.id
    for update
  loop
    perform public.restore_sale_inventory(
      v_sale.id,
      'sales_reset_restore',
      'Sales data reset',
      'Inventory restored before resetting sales data.',
      p_actor_profile_id,
      'sales-reset:' || v_sale.id::text
    );
  end loop;

  select coalesce(sum(quantity_change), 0), count(*)
  into v_restored_units, v_restore_movements
  from public.inventory_movements
  where movement_type = 'sales_reset_restore'
    and actor_profile_id = p_actor_profile_id
    and created_at >= transaction_timestamp();

  delete from public.sale_expenses;
  delete from public.sale_locations;
  delete from public.payments;
  delete from public.sale_items;
  delete from public.sales;

  return jsonb_build_object(
    'ok', true,
    'resetSales', v_reset_sales,
    'resetSaleItems', v_reset_sale_items,
    'resetPayments', v_reset_payments,
    'resetSaleExpenses', v_reset_sale_expenses,
    'resetSaleLocations', v_reset_sale_locations,
    'restoredUnits', coalesce(v_restored_units, 0),
    'restoreMovements', coalesce(v_restore_movements, 0)
  );
end;
$$;

revoke all on function public.restore_sale_inventory(uuid, text, text, text, uuid, text) from public;
revoke all on function public.reset_all_sales_data(uuid) from public;

grant execute on function public.restore_sale_inventory(uuid, text, text, text, uuid, text) to service_role;
grant execute on function public.reset_all_sales_data(uuid) to service_role;

commit;
