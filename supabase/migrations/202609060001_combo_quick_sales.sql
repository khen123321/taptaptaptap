begin;

alter table public.sales
drop constraint if exists sales_package_type_check,
add constraint sales_package_type_check check (package_type in ('buy_1', 'buy_2', 'bulk', 'custom', 'combo'));

create or replace function public.quick_sale_items_snapshot(
  p_sale_items jsonb default '[]'::jsonb,
  p_product_id uuid default null,
  p_package_type text default 'buy_1',
  p_custom_quantity integer default null,
  p_custom_amount numeric default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_items_input jsonb;
  v_input jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_requested_package text;
  v_effective_package text;
  v_quantity integer;
  v_single_price numeric(10,2);
  v_bundle_price numeric(10,2);
  v_bulk_unit_price numeric(10,2);
  v_gross numeric(10,2);
  v_discount numeric(10,2);
  v_final numeric(10,2);
  v_package_label text;
  v_pricing_tier_label text;
  v_items jsonb := '[]'::jsonb;
  v_count integer := 0;
  v_total_gross numeric(10,2) := 0;
  v_total_discount numeric(10,2) := 0;
  v_total_final numeric(10,2) := 0;
begin
  if p_sale_items is not null and jsonb_typeof(p_sale_items) <> 'array' then
    raise exception 'Sale items must be an array.';
  end if;

  v_items_input := coalesce(p_sale_items, '[]'::jsonb);
  if jsonb_array_length(v_items_input) = 0 then
    if p_product_id is null then
      raise exception 'Product is required.';
    end if;

    v_items_input := jsonb_build_array(jsonb_build_object(
      'productId', p_product_id,
      'packageType', p_package_type,
      'quantity', p_custom_quantity,
      'customAmount', p_custom_amount
    ));
  end if;

  if jsonb_array_length(v_items_input) = 0 then
    raise exception 'At least one sale item is required.';
  end if;

  for v_input in select value from jsonb_array_elements(v_items_input)
  loop
    v_product_id := nullif(coalesce(v_input ->> 'productId', v_input ->> 'product_id', ''), '')::uuid;
    v_requested_package := lower(btrim(coalesce(v_input ->> 'packageType', v_input ->> 'package_type', 'buy_1')));
    v_bulk_unit_price := null;
    v_pricing_tier_label := null;

    if v_product_id is null then
      raise exception 'Product is required for every sale item.';
    end if;

    if v_requested_package not in ('buy_1', 'buy_2', 'bulk', 'custom') then
      raise exception 'Invalid sale package.';
    end if;

    v_effective_package := v_requested_package;
    if v_requested_package = 'bulk' then
      v_quantity := coalesce(nullif(v_input ->> 'quantity', '')::integer, nullif(v_input ->> 'customQuantity', '')::integer, nullif(v_input ->> 'custom_quantity', '')::integer);
      if v_quantity = 1 then
        v_effective_package := 'buy_1';
      elsif v_quantity = 2 then
        v_effective_package := 'buy_2';
      end if;
    end if;

    select *
    into v_product
    from public.products
    where id = v_product_id;

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

      v_quantity := coalesce(nullif(v_input ->> 'quantity', '')::integer, nullif(v_input ->> 'customQuantity', '')::integer, nullif(v_input ->> 'custom_quantity', '')::integer);
      if v_quantity is null or v_quantity <= 0 then
        raise exception 'Bulk quantity must be a positive whole number.';
      end if;

      if v_quantity < v_product.bulk_tier_1_min then
        raise exception 'Bulk pricing starts at 10 units.';
      end if;

      v_gross := v_single_price * v_quantity;
      v_package_label := 'Bulk / Reseller';

      if v_quantity >= v_product.bulk_tier_2_min then
        v_bulk_unit_price := v_product.bulk_tier_2_unit_price;
        v_pricing_tier_label := concat(v_product.bulk_tier_2_min, '+ Cards');
      elsif v_quantity between v_product.bulk_tier_1_min and v_product.bulk_tier_1_max then
        v_bulk_unit_price := v_product.bulk_tier_1_unit_price;
        v_pricing_tier_label := concat(v_product.bulk_tier_1_min, '-', v_product.bulk_tier_1_max, ' Cards');
      else
        raise exception 'Bulk pricing starts at 10 units.';
      end if;

      if v_bulk_unit_price is null then
        raise exception 'Bulk pricing is not fully configured for this product.';
      end if;

      v_final := v_quantity * v_bulk_unit_price;
      v_discount := greatest(v_gross - v_final, 0);
    else
      v_quantity := coalesce(nullif(v_input ->> 'quantity', '')::integer, nullif(v_input ->> 'customQuantity', '')::integer, nullif(v_input ->> 'custom_quantity', '')::integer);
      if v_quantity is null or v_quantity <= 0 then
        raise exception 'Custom quantity must be a positive whole number.';
      end if;

      v_final := coalesce(nullif(v_input ->> 'customAmount', '')::numeric, nullif(v_input ->> 'custom_amount', '')::numeric);
      if v_final is null or v_final < 0 then
        raise exception 'Custom amount must be zero or greater.';
      end if;

      v_package_label := 'Custom';
      v_gross := v_single_price * v_quantity;
      v_discount := greatest(v_gross - v_final, 0);
    end if;

    v_count := v_count + 1;
    v_total_gross := v_total_gross + v_gross;
    v_total_discount := v_total_discount + v_discount;
    v_total_final := v_total_final + v_final;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'productId', v_product.id,
      'productName', v_product.name,
      'sku', v_product.sku,
      'packageType', v_effective_package,
      'packageLabel', v_package_label,
      'quantity', v_quantity,
      'regularUnitPrice', v_single_price,
      'bulkUnitPrice', v_bulk_unit_price,
      'pricingTierLabel', v_pricing_tier_label,
      'grossAmount', v_gross,
      'discountAmount', v_discount,
      'finalAmount', v_final,
      'unitCostSnapshot', v_product.current_unit_cost
    ));
  end loop;

  return jsonb_build_object(
    'items', v_items,
    'salePackageType', case when v_count > 1 then 'combo' else v_items #>> '{0,packageType}' end,
    'grossAmount', v_total_gross,
    'discountAmount', v_total_discount,
    'totalAmount', v_total_final
  );
end;
$$;

create or replace function public.lock_products_for_sale_items(p_items jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_id uuid;
begin
  for v_product_id in
    select distinct nullif(value ->> 'productId', '')::uuid
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
    where nullif(value ->> 'productId', '') is not null
    order by 1
  loop
    perform 1 from public.products where id = v_product_id for update;
  end loop;
end;
$$;

drop function if exists public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text, text, timestamptz, jsonb);

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
  p_completed_at timestamptz default null,
  p_sale_expenses jsonb default '[]'::jsonb,
  p_sale_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_existing_sale public.sales%rowtype;
  v_existing_payment public.payments%rowtype;
  v_existing_item_count integer;
  v_duplicate_payment record;
  v_sale public.sales%rowtype;
  v_payment_method text;
  v_normalized_reference text;
  v_sale_status text;
  v_completed_at timestamptz;
  v_snapshot jsonb;
  v_item jsonb;
  v_payment_status text;
begin
  select * into v_actor from public.profiles where id = p_actor_profile_id and role = 'admin';
  if not found then raise exception 'Quick sale requires an admin profile.'; end if;

  v_payment_method := lower(btrim(coalesce(p_payment_method, 'cash')));
  if v_payment_method not in ('gcash', 'bank_transfer', 'cash', 'other') then raise exception 'Invalid payment method.'; end if;

  v_sale_status := lower(btrim(coalesce(p_sale_status, 'completed')));
  if v_sale_status not in ('pending', 'completed') then raise exception 'Invalid sale status.'; end if;

  v_completed_at := case when v_sale_status = 'completed' then coalesce(p_completed_at, now()) else null end;
  if v_completed_at is not null and v_completed_at > now() then raise exception 'Sold date and time cannot be in the future.'; end if;

  perform public.lock_products_for_sale_items(case when jsonb_array_length(coalesce(p_sale_items, '[]'::jsonb)) > 0 then p_sale_items else jsonb_build_array(jsonb_build_object('productId', p_product_id)) end);
  v_snapshot := public.quick_sale_items_snapshot(p_sale_items, p_product_id, p_package_type, p_custom_quantity, p_custom_amount);

  if v_payment_method in ('gcash', 'bank_transfer') and nullif(btrim(coalesce(p_reference_number, '')), '') is not null then
    v_normalized_reference := public.normalize_payment_reference(p_reference_number);
  end if;

  if p_idempotency_key is not null then
    select * into v_existing_sale from public.sales where idempotency_key = nullif(btrim(p_idempotency_key), '');
    if found then
      select * into v_existing_payment from public.payments where sale_id = v_existing_sale.id limit 1;
      select count(*) into v_existing_item_count from public.sale_items where sale_id = v_existing_sale.id;

      if v_existing_payment.id is null
        or v_existing_sale.status <> v_sale_status
        or v_existing_sale.package_type <> (v_snapshot ->> 'salePackageType')
        or v_existing_sale.gross_product_amount is distinct from (v_snapshot ->> 'grossAmount')::numeric
        or v_existing_sale.discount_total is distinct from (v_snapshot ->> 'discountAmount')::numeric
        or v_existing_sale.total_amount is distinct from (v_snapshot ->> 'totalAmount')::numeric
        or v_existing_payment.payment_method is distinct from v_payment_method
        or v_existing_payment.normalized_reference_number is distinct from v_normalized_reference
        or v_existing_item_count is distinct from jsonb_array_length(v_snapshot -> 'items')
        or (p_completed_at is not null and v_existing_sale.completed_at is distinct from v_completed_at)
      then
        raise exception 'Idempotency key was already used for a different sale.';
      end if;

      return public.sale_result_json(v_existing_sale.id);
    end if;
  end if;

  if v_payment_method in ('gcash', 'bank_transfer') and v_normalized_reference is not null then
    select s.sale_number into v_duplicate_payment
    from public.payments p join public.sales s on s.id = p.sale_id
    where p.payment_method = v_payment_method and p.normalized_reference_number = v_normalized_reference
    limit 1;
    if found then raise exception 'Payment reference already exists under Sale #%.' , v_duplicate_payment.sale_number; end if;
  end if;

  insert into public.sales (
    channel, handled_by_profile_id, status, package_type, gross_product_amount,
    discount_total, total_amount, notes, idempotency_key, completed_at
  )
  values (
    'physical', p_actor_profile_id, v_sale_status, v_snapshot ->> 'salePackageType',
    (v_snapshot ->> 'grossAmount')::numeric, (v_snapshot ->> 'discountAmount')::numeric,
    (v_snapshot ->> 'totalAmount')::numeric, nullif(btrim(coalesce(p_notes, '')), ''),
    nullif(btrim(coalesce(p_idempotency_key, '')), ''), v_completed_at
  )
  returning * into v_sale;

  for v_item in select value from jsonb_array_elements(v_snapshot -> 'items')
  loop
    insert into public.sale_items (
      sale_id, product_id, product_name_snapshot, sku_snapshot, package_label, quantity,
      unit_regular_price, bulk_unit_price, pricing_tier_label, gross_amount,
      discount_amount, final_amount, unit_cost_snapshot
    )
    values (
      v_sale.id, (v_item ->> 'productId')::uuid, v_item ->> 'productName', v_item ->> 'sku',
      v_item ->> 'packageLabel', (v_item ->> 'quantity')::integer, (v_item ->> 'regularUnitPrice')::numeric,
      nullif(v_item ->> 'bulkUnitPrice', '')::numeric, v_item ->> 'pricingTierLabel',
      (v_item ->> 'grossAmount')::numeric, (v_item ->> 'discountAmount')::numeric,
      (v_item ->> 'finalAmount')::numeric, (v_item ->> 'unitCostSnapshot')::numeric
    );
  end loop;

  v_payment_status := case when v_sale_status = 'completed' then 'paid' else 'pending' end;
  insert into public.payments (
    sale_id, payment_method, amount_received, reference_number, normalized_reference_number,
    payment_status, verified_by_profile_id, verified_at
  )
  values (
    v_sale.id, v_payment_method, v_sale.total_amount, nullif(btrim(coalesce(p_reference_number, '')), ''),
    v_normalized_reference, v_payment_status,
    case when v_sale_status = 'completed' then p_actor_profile_id else null end,
    case when v_sale_status = 'completed' then now() else null end
  );

  perform public.replace_sale_expenses(v_sale.id, p_actor_profile_id, p_sale_expenses);
  if v_sale_status = 'completed' then
    perform public.commit_sale_inventory(v_sale.id, p_actor_profile_id, p_idempotency_key);
  end if;

  return public.sale_result_json(v_sale.id);
end;
$$;

create or replace function public.commit_sale_inventory(
  p_sale_id uuid,
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
  v_requirement record;
  v_item public.sale_items%rowtype;
  v_product public.products%rowtype;
  v_previous integer;
  v_new integer;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found.'; end if;

  if exists (select 1 from public.inventory_movements where related_sale_id = v_sale.id and movement_type = 'sale_commit') then
    return;
  end if;

  for v_requirement in
    select product_id, sum(quantity)::integer as quantity
    from public.sale_items
    where sale_id = v_sale.id
    group by product_id
    order by product_id
  loop
    select * into v_product from public.products where id = v_requirement.product_id for update;
    if not found then raise exception 'Product not found.'; end if;
    if not v_product.track_inventory then raise exception 'Inventory tracking is disabled for this product.'; end if;
    if v_product.current_stock < v_requirement.quantity then raise exception 'Insufficient stock for this sale.'; end if;
  end loop;

  for v_item in
    select * from public.sale_items where sale_id = v_sale.id order by product_id, created_at, id
  loop
    select * into v_product from public.products where id = v_item.product_id for update;
    v_previous := v_product.current_stock;
    v_new := v_previous - v_item.quantity;
    update public.products set current_stock = v_new where id = v_product.id;

    insert into public.inventory_movements (
      product_id, movement_type, quantity_change, previous_quantity, new_quantity,
      reason, notes, actor_profile_id, related_sale_id, reference_id, idempotency_key
    )
    values (
      v_product.id, 'sale_commit', -v_item.quantity, v_previous, v_new,
      'Quick physical sale', v_sale.notes, p_actor_profile_id, v_sale.id, v_sale.sale_number,
      case when p_idempotency_key is null then null else nullif(btrim(p_idempotency_key), '') || ':inventory:' || v_item.id::text end
    );
  end loop;
end;
$$;

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
  if p_movement_type not in ('sale_cancel_restore', 'sale_delete_restore') then
    raise exception 'Invalid inventory restore type.';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found.'; end if;

  if not exists (select 1 from public.inventory_movements where related_sale_id = v_sale.id and movement_type = 'sale_commit') then
    return;
  end if;

  if exists (select 1 from public.inventory_movements where related_sale_id = v_sale.id and movement_type in ('sale_cancel_restore', 'sale_delete_restore')) then
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

create or replace function public.complete_pending_quick_sale(
  p_sale_id uuid,
  p_actor_profile_id uuid default null,
  p_idempotency_key text default null,
  p_completed_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_sale public.sales%rowtype;
  v_completed_at timestamptz := coalesce(p_completed_at, now());
begin
  if v_completed_at > now() then raise exception 'Sold date and time cannot be in the future.'; end if;
  select * into v_actor from public.profiles where id = p_actor_profile_id and role = 'admin';
  if not found then raise exception 'Sale completion requires an admin profile.'; end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found.'; end if;
  if v_sale.status = 'cancelled' then raise exception 'Cancelled sales cannot be marked sold.'; end if;
  if v_sale.status = 'completed' then return public.sale_result_json(v_sale.id); end if;

  perform public.commit_sale_inventory(v_sale.id, p_actor_profile_id, p_idempotency_key);

  update public.sales set status = 'completed', completed_at = v_completed_at where id = v_sale.id;
  update public.payments
  set payment_status = 'paid',
      amount_received = v_sale.total_amount,
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
begin
  select * into v_actor from public.profiles where id = p_actor_profile_id and role = 'admin';
  if not found then raise exception 'Sale cancellation requires an admin profile.'; end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found.'; end if;
  if v_sale.status = 'cancelled' then return public.sale_result_json(v_sale.id); end if;

  if v_sale.status = 'completed' then
    perform public.restore_sale_inventory(v_sale.id, 'sale_cancel_restore', 'Sale cancellation', p_reason, p_actor_profile_id, p_idempotency_key);
  end if;

  update public.sales
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by_profile_id = p_actor_profile_id,
      cancellation_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = v_sale.id;

  return public.sale_result_json(v_sale.id);
end;
$$;

drop function if exists public.update_quick_sale(uuid, uuid, text, integer, numeric, text, text, text, uuid, text, timestamptz, jsonb);

create or replace function public.update_quick_sale(
  p_sale_id uuid,
  p_product_id uuid default null,
  p_package_type text default null,
  p_custom_quantity integer default null,
  p_custom_amount numeric default null,
  p_payment_method text default null,
  p_reference_number text default null,
  p_notes text default null,
  p_actor_profile_id uuid default null,
  p_idempotency_key text default null,
  p_completed_at timestamptz default null,
  p_sale_expenses jsonb default '[]'::jsonb,
  p_sale_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_sale public.sales%rowtype;
  v_payment public.payments%rowtype;
  v_duplicate_payment record;
  v_payment_method text;
  v_normalized_reference text;
  v_snapshot jsonb;
  v_item jsonb;
begin
  select * into v_actor from public.profiles where id = p_actor_profile_id and role = 'admin';
  if not found then raise exception 'Sale update requires an admin profile.'; end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found.'; end if;
  if v_sale.deleted_at is not null then raise exception 'Deleted sales cannot be edited.'; end if;

  select * into v_payment from public.payments where sale_id = v_sale.id limit 1;
  if not found then raise exception 'Payment not found.'; end if;

  v_payment_method := lower(btrim(coalesce(p_payment_method, v_payment.payment_method)));
  if v_payment_method not in ('gcash', 'bank_transfer', 'cash', 'other') then raise exception 'Invalid payment method.'; end if;

  if v_payment_method in ('gcash', 'bank_transfer') and nullif(btrim(coalesce(p_reference_number, '')), '') is not null then
    v_normalized_reference := public.normalize_payment_reference(p_reference_number);
    select s.sale_number into v_duplicate_payment
    from public.payments p join public.sales s on s.id = p.sale_id
    where p.payment_method = v_payment_method
      and p.normalized_reference_number = v_normalized_reference
      and p.id <> v_payment.id
    limit 1;
    if found then raise exception 'Payment reference already exists under Sale #%.' , v_duplicate_payment.sale_number; end if;
  end if;

  if v_sale.status = 'pending' then
    perform public.lock_products_for_sale_items(case when jsonb_array_length(coalesce(p_sale_items, '[]'::jsonb)) > 0 then p_sale_items else jsonb_build_array(jsonb_build_object('productId', p_product_id)) end);
    v_snapshot := public.quick_sale_items_snapshot(p_sale_items, p_product_id, p_package_type, p_custom_quantity, p_custom_amount);

    delete from public.sale_items where sale_id = v_sale.id;
    for v_item in select value from jsonb_array_elements(v_snapshot -> 'items')
    loop
      insert into public.sale_items (
        sale_id, product_id, product_name_snapshot, sku_snapshot, package_label, quantity,
        unit_regular_price, bulk_unit_price, pricing_tier_label, gross_amount,
        discount_amount, final_amount, unit_cost_snapshot
      )
      values (
        v_sale.id, (v_item ->> 'productId')::uuid, v_item ->> 'productName', v_item ->> 'sku',
        v_item ->> 'packageLabel', (v_item ->> 'quantity')::integer, (v_item ->> 'regularUnitPrice')::numeric,
        nullif(v_item ->> 'bulkUnitPrice', '')::numeric, v_item ->> 'pricingTierLabel',
        (v_item ->> 'grossAmount')::numeric, (v_item ->> 'discountAmount')::numeric,
        (v_item ->> 'finalAmount')::numeric, (v_item ->> 'unitCostSnapshot')::numeric
      );
    end loop;

    update public.sales
    set package_type = v_snapshot ->> 'salePackageType',
        gross_product_amount = (v_snapshot ->> 'grossAmount')::numeric,
        discount_total = (v_snapshot ->> 'discountAmount')::numeric,
        total_amount = (v_snapshot ->> 'totalAmount')::numeric,
        completed_at = null,
        notes = nullif(btrim(coalesce(p_notes, '')), '')
    where id = v_sale.id;

    update public.payments
    set payment_method = v_payment_method,
        amount_received = (v_snapshot ->> 'totalAmount')::numeric,
        reference_number = nullif(btrim(coalesce(p_reference_number, '')), ''),
        normalized_reference_number = v_normalized_reference,
        payment_status = 'pending',
        verified_by_profile_id = null,
        verified_at = null
    where id = v_payment.id;
  elsif v_sale.status = 'completed' then
    if p_completed_at is not null and p_completed_at > now() then raise exception 'Sold date and time cannot be in the future.'; end if;
    update public.sales set completed_at = coalesce(p_completed_at, completed_at), notes = nullif(btrim(coalesce(p_notes, '')), '') where id = v_sale.id;
    update public.payments
    set payment_method = v_payment_method,
        reference_number = nullif(btrim(coalesce(p_reference_number, '')), ''),
        normalized_reference_number = v_normalized_reference
    where id = v_payment.id;
  elsif v_sale.status = 'cancelled' then
    update public.sales set notes = nullif(btrim(coalesce(p_notes, '')), '') where id = v_sale.id;
  else
    raise exception 'Invalid sale status.';
  end if;

  if v_sale.status <> 'cancelled' then
    perform public.replace_sale_expenses(v_sale.id, p_actor_profile_id, p_sale_expenses);
  end if;

  return public.sale_result_json(v_sale.id);
end;
$$;

create or replace function public.soft_delete_quick_sale(
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
begin
  select * into v_actor from public.profiles where id = p_actor_profile_id and role = 'admin';
  if not found then raise exception 'Sale deletion requires an admin profile.'; end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found.'; end if;
  if v_sale.deleted_at is not null then return public.sale_result_json(v_sale.id); end if;

  if v_sale.status = 'completed' then
    perform public.restore_sale_inventory(v_sale.id, 'sale_delete_restore', 'Sale soft delete', p_reason, p_actor_profile_id, p_idempotency_key);
  end if;

  update public.sales
  set deleted_at = now(),
      deleted_by_profile_id = p_actor_profile_id,
      delete_reason = nullif(btrim(coalesce(p_reason, '')), '')
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
  with sale_items_json as (
    select
      si.sale_id,
      jsonb_agg(
        jsonb_build_object(
          'productId', si.product_id,
          'productName', si.product_name_snapshot,
          'sku', si.sku_snapshot,
          'packageLabel', si.package_label,
          'pricingTierLabel', si.pricing_tier_label,
          'quantity', si.quantity,
          'regularUnitPrice', si.unit_regular_price,
          'bulkUnitPrice', si.bulk_unit_price,
          'grossAmount', si.gross_amount,
          'discountAmount', si.discount_amount,
          'finalAmount', si.final_amount,
          'unitCostSnapshot', si.unit_cost_snapshot
        )
        order by si.created_at asc, si.id asc
      ) as items
    from public.sale_items si
    where si.sale_id = p_sale_id
    group by si.sale_id
  ),
  first_item as (
    select *
    from public.sale_items
    where sale_id = p_sale_id
    order by created_at asc, id asc
    limit 1
  ),
  expense_summary as (
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
    where expense.sale_id = p_sale_id
  )
  select jsonb_build_object(
    'saleId', s.id,
    'saleNumber', s.sale_number,
    'status', s.status,
    'items', coalesce(sij.items, '[]'::jsonb),
    'productId', fi.product_id,
    'productName', case
      when jsonb_array_length(coalesce(sij.items, '[]'::jsonb)) > 1 then 'Combo sale'
      else fi.product_name_snapshot
    end,
    'packageLabel', case when s.package_type = 'combo' then 'Combo' else fi.package_label end,
    'pricingTierLabel', fi.pricing_tier_label,
    'quantity', coalesce((select sum((item ->> 'quantity')::integer) from jsonb_array_elements(coalesce(sij.items, '[]'::jsonb)) item), 0),
    'regularUnitPrice', fi.unit_regular_price,
    'bulkUnitPrice', fi.bulk_unit_price,
    'grossAmount', s.gross_product_amount,
    'discountAmount', s.discount_total,
    'finalAmount', s.total_amount,
    'unitCostSnapshot', fi.unit_cost_snapshot,
    'paymentMethod', p.payment_method,
    'paymentReference', p.reference_number,
    'previousStock', im.previous_quantity,
    'newStock', im.new_quantity,
    'movementId', im.id,
    'totalDirectDeductions', expense_summary.total_direct_deductions,
    'netAfterDeductions', s.total_amount - expense_summary.total_direct_deductions,
    'expenses', expense_summary.expenses,
    'createdAt', s.created_at,
    'completedAt', s.completed_at
  )
  from public.sales s
  left join first_item fi on fi.sale_id = s.id
  left join sale_items_json sij on sij.sale_id = s.id
  join public.payments p on p.sale_id = s.id
  left join lateral (
    select *
    from public.inventory_movements movement
    where movement.related_sale_id = s.id
      and movement.movement_type in ('sale_commit', 'sale_cancel_restore', 'sale_delete_restore')
    order by movement.created_at desc
    limit 1
  ) im on true
  left join expense_summary on true
  where s.id = p_sale_id
  limit 1;
$$;

revoke all on function public.quick_sale_items_snapshot(jsonb, uuid, text, integer, numeric) from public;
revoke all on function public.lock_products_for_sale_items(jsonb) from public;
revoke all on function public.commit_sale_inventory(uuid, uuid, text) from public;
revoke all on function public.restore_sale_inventory(uuid, text, text, text, uuid, text) from public;
revoke all on function public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text, text, timestamptz, jsonb, jsonb) from public;
revoke all on function public.update_quick_sale(uuid, uuid, text, integer, numeric, text, text, text, uuid, text, timestamptz, jsonb, jsonb) from public;
revoke all on function public.complete_pending_quick_sale(uuid, uuid, text, timestamptz) from public;
revoke all on function public.cancel_quick_sale(uuid, text, uuid, text) from public;
revoke all on function public.soft_delete_quick_sale(uuid, text, uuid, text) from public;
revoke all on function public.sale_result_json(uuid) from public;

grant execute on function public.quick_sale_items_snapshot(jsonb, uuid, text, integer, numeric) to service_role;
grant execute on function public.lock_products_for_sale_items(jsonb) to service_role;
grant execute on function public.commit_sale_inventory(uuid, uuid, text) to service_role;
grant execute on function public.restore_sale_inventory(uuid, text, text, text, uuid, text) to service_role;
grant execute on function public.record_quick_physical_sale(uuid, text, integer, numeric, text, text, text, uuid, text, text, timestamptz, jsonb, jsonb) to service_role;
grant execute on function public.update_quick_sale(uuid, uuid, text, integer, numeric, text, text, text, uuid, text, timestamptz, jsonb, jsonb) to service_role;
grant execute on function public.complete_pending_quick_sale(uuid, uuid, text, timestamptz) to service_role;
grant execute on function public.cancel_quick_sale(uuid, text, uuid, text) to service_role;
grant execute on function public.soft_delete_quick_sale(uuid, text, uuid, text) to service_role;
grant execute on function public.sale_result_json(uuid) to service_role;

commit;
