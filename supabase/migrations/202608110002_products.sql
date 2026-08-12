create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  product_type text not null default 'standard',
  category text,
  price_single numeric(10,2) not null default 0,
  price_bundle numeric(10,2),
  bundle_savings numeric(10,2),
  card_image_url text,
  detail_image_url text,
  mockup_image_url text,
  included_features jsonb not null default '[]'::jsonb,
  cta_label text,
  cta_href text,
  status text not null default 'draft',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_product_type_check check (product_type in ('standard', 'custom')),
  constraint products_status_check check (status in ('draft', 'published', 'archived')),
  constraint products_price_single_check check (price_single >= 0),
  constraint products_price_bundle_check check (price_bundle is null or price_bundle >= 0),
  constraint products_bundle_savings_check check (bundle_savings is null or bundle_savings >= 0)
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_display_order_idx on public.products(display_order);
create index if not exists products_updated_at_idx on public.products(updated_at);

alter table public.products enable row level security;

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
on public.products for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products"
on public.products for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

insert into public.products (
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
  display_order
) values
(
  'Google Review NFC Sign',
  'google-review-nfc-sign',
  'Make leaving a Google review as simple as tapping a phone.',
  'Make leaving a Google review as simple as tapping a phone.',
  'standard',
  'nfc-signs',
  899,
  1499,
  299,
  '/images/products/google-review-sign.png',
  '/images/products/google-review-sign.png',
  null,
  '["Free nationwide shipping","Google Review integration","Initial NFC setup & programming","Ready-to-use setup","Business link setup","Setup assistance","No monthly subscription"]'::jsonb,
  'Order Google Review Sign',
  'mailto:taptaptap.official@outlook.com?subject=Order%20Google%20Review%20NFC%20Sign',
  'published',
  1
),
(
  'Facebook Follow NFC Sign',
  'facebook-follow-nfc-sign',
  'Let customers instantly open and follow your Facebook Page with one tap.',
  'Let customers instantly open and follow your Facebook Page with one tap.',
  'standard',
  'nfc-signs',
  899,
  1499,
  299,
  '/images/products/facebook-follow-sign.png',
  '/images/products/facebook-follow-sign.png',
  null,
  '["Free nationwide shipping","Facebook Page integration","Initial NFC setup & programming","Ready-to-use setup","Business link setup","Setup assistance","No monthly subscription"]'::jsonb,
  'Order Facebook Sign',
  'mailto:taptaptap.official@outlook.com?subject=Order%20Facebook%20NFC%20Sign',
  'published',
  2
),
(
  'Custom Branded NFC Sign',
  'custom-branded-nfc-sign',
  'Create an NFC sign using your business logo, colors, branding, and custom artwork.',
  'Create an NFC sign using your business logo, colors, branding, and custom artwork.',
  'custom',
  'custom',
  1099,
  1899,
  299,
  '/images/products/custom-branded-card.png',
  '/images/products/custom-branded-card.png',
  '/images/products/mockups/blank-nfc-stand.png',
  '["Free nationwide shipping","Initial NFC setup & programming","Business link integration","Ready-to-use setup","Business logo","Business name","Brand colors","Personalized NFC sign design","QR-code backup","Setup assistance","No monthly subscription"]'::jsonb,
  'Customize Yours',
  '/customize',
  'published',
  3
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  product_type = excluded.product_type,
  category = excluded.category,
  price_single = excluded.price_single,
  price_bundle = excluded.price_bundle,
  bundle_savings = excluded.bundle_savings,
  card_image_url = excluded.card_image_url,
  detail_image_url = excluded.detail_image_url,
  mockup_image_url = excluded.mockup_image_url,
  included_features = excluded.included_features,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  status = excluded.status,
  display_order = excluded.display_order;
