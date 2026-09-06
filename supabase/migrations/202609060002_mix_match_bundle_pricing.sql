begin;

alter table public.products
add column if not exists mix_match_bundle_enabled boolean not null default false,
add column if not exists mix_match_bundle_group text,
add column if not exists mix_match_bundle_size integer not null default 2,
add column if not exists mix_match_bundle_price numeric(10,2);

alter table public.products
drop constraint if exists products_mix_match_bundle_group_check,
add constraint products_mix_match_bundle_group_check check (
  mix_match_bundle_group is null or btrim(mix_match_bundle_group) <> ''
);

alter table public.products
drop constraint if exists products_mix_match_bundle_size_check,
add constraint products_mix_match_bundle_size_check check (mix_match_bundle_size >= 2);

alter table public.products
drop constraint if exists products_mix_match_bundle_price_check,
add constraint products_mix_match_bundle_price_check check (
  mix_match_bundle_price is null or mix_match_bundle_price >= 0
);

alter table public.products
drop constraint if exists products_mix_match_bundle_enabled_check,
add constraint products_mix_match_bundle_enabled_check check (
  not mix_match_bundle_enabled
  or (mix_match_bundle_group is not null and mix_match_bundle_price is not null)
);

update public.products
set
  mix_match_bundle_enabled = true,
  mix_match_bundle_group = 'standard_nfc_card',
  mix_match_bundle_size = 2,
  mix_match_bundle_price = 1499
where slug in ('google-review-nfc-sign', 'facebook-follow-nfc-sign');

update public.products
set mix_match_bundle_enabled = false
where slug in ('instagram-nfc-keychain', 'custom-branded-nfc-sign');

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
  v_mix_match_candidate boolean := true;
  v_mix_match_group text := null;
  v_mix_match_price numeric(10,2) := null;
  v_mix_match_discount numeric(10,2);
  v_allocated_discount numeric(10,2) := 0;
  v_allocated_final numeric(10,2) := 0;
  v_repriced_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_item_discount numeric(10,2);
  v_item_final numeric(10,2);
  v_index integer := 0;
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

    if not (
      v_effective_package = 'buy_1'
      and v_quantity = 1
      and v_product.mix_match_bundle_enabled
      and v_product.mix_match_bundle_size = 2
      and v_product.mix_match_bundle_group is not null
      and v_product.mix_match_bundle_price is not null
    ) then
      v_mix_match_candidate := false;
    elsif v_mix_match_group is null then
      v_mix_match_group := v_product.mix_match_bundle_group;
      v_mix_match_price := v_product.mix_match_bundle_price;
    elsif v_mix_match_group <> v_product.mix_match_bundle_group
      or v_mix_match_price is distinct from v_product.mix_match_bundle_price then
      v_mix_match_candidate := false;
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

  if v_count = 2 and v_mix_match_candidate and v_mix_match_price is not null and v_mix_match_price < v_total_final then
    v_mix_match_discount := v_total_final - v_mix_match_price;

    for v_item in select value from jsonb_array_elements(v_items)
    loop
      v_index := v_index + 1;
      if v_index = v_count then
        v_item_discount := v_mix_match_discount - v_allocated_discount;
        v_item_final := v_mix_match_price - v_allocated_final;
      else
        v_item_discount := round(v_mix_match_discount * ((v_item ->> 'grossAmount')::numeric / v_total_final), 2);
        v_item_final := (v_item ->> 'grossAmount')::numeric - v_item_discount;
      end if;

      v_allocated_discount := v_allocated_discount + v_item_discount;
      v_allocated_final := v_allocated_final + v_item_final;
      v_repriced_items := v_repriced_items || jsonb_build_array(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(v_item, '{packageLabel}', to_jsonb('Mix & Match'::text)),
              '{pricingTierLabel}', to_jsonb('2 Standard NFC Cards'::text)
            ),
            '{discountAmount}', to_jsonb(v_item_discount)
          ),
          '{finalAmount}', to_jsonb(v_item_final)
        )
      );
    end loop;

    v_items := v_repriced_items;
    v_total_discount := v_mix_match_discount;
    v_total_final := v_mix_match_price;
  end if;

  return jsonb_build_object(
    'items', v_items,
    'salePackageType', case when v_count > 1 then 'combo' else v_items #>> '{0,packageType}' end,
    'grossAmount', v_total_gross,
    'discountAmount', v_total_discount,
    'totalAmount', v_total_final
  );
end;
$$;

revoke all on function public.quick_sale_items_snapshot(jsonb, uuid, text, integer, numeric) from public;
grant execute on function public.quick_sale_items_snapshot(jsonb, uuid, text, integer, numeric) to service_role;

commit;
