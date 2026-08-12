create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_name text not null,
  page_path text,
  product_id uuid references public.products(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  referrer text,
  created_at timestamptz not null default now(),
  constraint analytics_events_event_name_check check (
    event_name in (
      'page_view',
      'product_view',
      'product_details_open',
      'customizer_open',
      'customizer_upload',
      'customizer_request',
      'contact_click',
      'facebook_click',
      'email_click',
      'shop_click'
    )
  ),
  constraint analytics_events_session_id_length_check check (char_length(session_id) between 8 and 128),
  constraint analytics_events_page_path_length_check check (page_path is null or char_length(page_path) <= 512),
  constraint analytics_events_referrer_length_check check (referrer is null or char_length(referrer) <= 512)
);

create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_session_id_idx on public.analytics_events(session_id);
create index if not exists analytics_events_product_id_idx on public.analytics_events(product_id);
create index if not exists analytics_events_page_path_idx on public.analytics_events(page_path);
create index if not exists analytics_events_range_event_idx on public.analytics_events(created_at, event_name);

alter table public.analytics_events enable row level security;

drop policy if exists "Admins can read analytics events" on public.analytics_events;
create policy "Admins can read analytics events"
on public.analytics_events for select
to authenticated
using (public.is_admin());
