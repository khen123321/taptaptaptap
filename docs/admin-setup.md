# TapTapTap Admin Setup

The admin system uses Supabase Auth, Postgres RLS, Supabase Storage, and server-side admin route handlers.

## Environment Variables

`.env.local` should contain:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

`SUPABASE_SECRET_KEY` is used only by server-side route handlers. Do not prefix it with `NEXT_PUBLIC_`.

## Migrations

Run these SQL files in order:

```text
supabase/migrations/202608110001_profiles.sql
supabase/migrations/202608110002_products.sql
```

The profiles migration creates:

- `public.profiles`
- `public.is_admin()`
- admin/customer role constraints
- RLS policies for own-profile reads and admin-only profile management

The products migration creates:

- `public.products`
- product type constraints: `standard`, `custom`
- status constraints: `draft`, `published`, `archived`
- product RLS policies
- `product-images` Storage bucket
- Storage policies for public reads and admin writes
- seed rows for the three current TapTapTap products

## First Admin Account

1. In Supabase Dashboard, open Authentication.
2. Create a user manually with your admin email and password.
3. Copy the new user's UUID.
4. Open SQL Editor.
5. Run this SQL with your own values:

```sql
insert into public.profiles (user_id, email, role)
values ('YOUR_AUTH_USER_UUID', 'YOUR_ADMIN_EMAIL', 'admin');
```

Do not commit real admin credentials or user UUIDs into source code.

## Product Images

The product table separates:

- `card_image_url` for product cards and product listings
- `detail_image_url` for Product Details modal and product detail pages
- `mockup_image_url` for customization mockups

Local public paths and Supabase Storage public URLs are both supported.

The expected Custom Branded defaults are:

```text
card_image_url: /images/products/custom-branded-card.png
detail_image_url: /images/products/custom-branded-card.png
mockup_image_url: /images/products/mockups/blank-nfc-stand.png
```

## Admin Routes

- `/admin/login`
- `/admin`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]/edit`
- `/admin/analytics` remains Coming Soon
- `/api/admin/products`
- `/api/admin/products/[id]`
- `/api/admin/product-images`
- `/api/admin/logout`

All product mutations verify the authenticated Supabase user and require `profiles.role = 'admin'`.
