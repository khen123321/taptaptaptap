create table if not exists public.public_map_locations (
  id uuid primary key default gen_random_uuid(),
  city_name text not null,
  province_name text,
  region_name text,
  city_latitude numeric(9, 6) not null,
  city_longitude numeric(9, 6) not null,
  city_provider_id text not null,
  display_count integer not null default 1,
  is_visible boolean not null default true,
  notes text,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_map_locations_city_check check (length(btrim(city_name)) > 0),
  constraint public_map_locations_provider_check check (length(btrim(city_provider_id)) > 0),
  constraint public_map_locations_display_count_check check (display_count >= 0),
  constraint public_map_locations_philippines_bounds_check check (
    city_latitude between 4 and 22
    and city_longitude between 116 and 127
  )
);

drop trigger if exists public_map_locations_set_updated_at on public.public_map_locations;
create trigger public_map_locations_set_updated_at
before update on public.public_map_locations
for each row execute function public.set_updated_at();

create unique index if not exists public_map_locations_provider_unique_idx
on public.public_map_locations(city_provider_id);

create unique index if not exists public_map_locations_city_unique_idx
on public.public_map_locations(lower(city_name), lower(coalesce(province_name, '')));

create index if not exists public_map_locations_visible_idx
on public.public_map_locations(is_visible, city_name)
where is_visible = true;

alter table public.public_map_locations enable row level security;

revoke all on public.public_map_locations from PUBLIC, anon, authenticated;

drop policy if exists "Admins can read public map locations" on public.public_map_locations;
create policy "Admins can read public map locations"
on public.public_map_locations for select
to authenticated
using (public.is_admin());

grant select on public.public_map_locations to authenticated;
grant select, insert, update, delete on public.public_map_locations to service_role;
