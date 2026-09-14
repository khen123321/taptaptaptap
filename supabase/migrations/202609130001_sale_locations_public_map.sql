create table if not exists public.sale_locations (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  city_name text not null,
  province_name text,
  region_name text,
  city_latitude numeric(9, 6) not null,
  city_longitude numeric(9, 6) not null,
  show_on_public_map boolean not null default true,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sale_locations_sale_id_unique unique (sale_id),
  constraint sale_locations_city_check check (length(btrim(city_name)) > 0),
  constraint sale_locations_philippines_bounds_check check (
    city_latitude between 4 and 22
    and city_longitude between 116 and 127
  )
);

drop trigger if exists sale_locations_set_updated_at on public.sale_locations;
create trigger sale_locations_set_updated_at
before update on public.sale_locations
for each row execute function public.set_updated_at();

create index if not exists sale_locations_public_map_idx
on public.sale_locations(show_on_public_map, city_name, province_name)
where show_on_public_map = true;

create index if not exists sale_locations_sale_id_idx
on public.sale_locations(sale_id);

alter table public.sale_locations enable row level security;

revoke all on public.sale_locations from PUBLIC, anon, authenticated;

drop policy if exists "Admins can read sale locations" on public.sale_locations;
create policy "Admins can read sale locations"
on public.sale_locations for select
to authenticated
using (public.is_admin());

grant select on public.sale_locations to authenticated;
grant select, insert, update on public.sale_locations to service_role;

create or replace function public.get_public_sale_city_markers()
returns table (
  city_name text,
  province_name text,
  region_name text,
  city_latitude numeric,
  city_longitude numeric,
  sales_count bigint,
  units_sold bigint
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with completed_sales as (
    select
      s.id,
      loc.city_name,
      loc.province_name,
      loc.region_name,
      loc.city_latitude,
      loc.city_longitude
    from public.sale_locations loc
    join public.sales s on s.id = loc.sale_id
    where loc.show_on_public_map = true
      and s.status = 'completed'
      and s.deleted_at is null
      and loc.city_latitude is not null
      and loc.city_longitude is not null
  ),
  sale_units as (
    select
      cs.id,
      cs.city_name,
      cs.province_name,
      cs.region_name,
      cs.city_latitude,
      cs.city_longitude,
      coalesce(sum(si.quantity), 0)::bigint as sale_units_sold
    from completed_sales cs
    left join public.sale_items si on si.sale_id = cs.id
    group by
      cs.id,
      cs.city_name,
      cs.province_name,
      cs.region_name,
      cs.city_latitude,
      cs.city_longitude
  )
  select
    su.city_name,
    su.province_name,
    su.region_name,
    su.city_latitude,
    su.city_longitude,
    count(*)::bigint as sales_count,
    sum(su.sale_units_sold)::bigint as units_sold
  from sale_units su
  group by
    su.city_name,
    su.province_name,
    su.region_name,
    su.city_latitude,
    su.city_longitude
  order by sales_count desc, city_name asc;
$$;

revoke all on function public.get_public_sale_city_markers() from public;
grant execute on function public.get_public_sale_city_markers() to anon, authenticated, service_role;
