begin;

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
  v_sale_ids uuid[] := array[]::uuid[];
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

  select coalesce(array_agg(id), array[]::uuid[]) into v_sale_ids from public.sales;

  v_reset_sales := cardinality(v_sale_ids);
  select count(*) into v_reset_sale_items from public.sale_items where sale_id = any(v_sale_ids);
  select count(*) into v_reset_payments from public.payments where sale_id = any(v_sale_ids);
  select count(*) into v_reset_sale_expenses from public.sale_expenses where sale_id = any(v_sale_ids);
  select count(*) into v_reset_sale_locations from public.sale_locations where sale_id = any(v_sale_ids);

  for v_sale in
    select s.*
    from public.sales s
    where s.id = any(v_sale_ids)
      and exists (
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

  delete from public.sale_expenses
  where sale_id = any(v_sale_ids);

  delete from public.sale_locations
  where sale_id = any(v_sale_ids);

  delete from public.payments
  where sale_id = any(v_sale_ids);

  delete from public.sale_items
  where sale_id = any(v_sale_ids);

  delete from public.sales
  where id = any(v_sale_ids);

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

revoke all on function public.reset_all_sales_data(uuid) from public;
grant execute on function public.reset_all_sales_data(uuid) to service_role;

commit;
