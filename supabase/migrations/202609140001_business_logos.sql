create table if not exists public.business_logos (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  logo_url text not null,
  website_url text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_logos_business_name_check check (length(btrim(business_name)) > 0),
  constraint business_logos_logo_url_check check (
    logo_url ~ '^https://drive\.google\.com/thumbnail\?id=[A-Za-z0-9_-]+&sz=w1000$'
  ),
  constraint business_logos_website_url_check check (
    website_url is null or website_url ~ '^https?://'
  )
);

drop trigger if exists business_logos_set_updated_at on public.business_logos;
create trigger business_logos_set_updated_at
before update on public.business_logos
for each row execute function public.set_updated_at();

create unique index if not exists business_logos_name_unique_idx
on public.business_logos(lower(business_name));

create index if not exists business_logos_visible_sort_idx
on public.business_logos(is_visible, sort_order, business_name)
where is_visible = true;

alter table public.business_logos enable row level security;

revoke all on public.business_logos from PUBLIC, anon, authenticated;

drop policy if exists "Admins can read business logos" on public.business_logos;
create policy "Admins can read business logos"
on public.business_logos for select
to authenticated
using (public.is_admin());

grant select on public.business_logos to authenticated;
grant select, insert, update, delete on public.business_logos to service_role;
