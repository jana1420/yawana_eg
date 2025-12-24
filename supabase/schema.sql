create type public.order_status as enum ('pending','processing','paid','shipped','delivered','cancelled');

create type public.user_role as enum ('customer','admin');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_featured boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  description text,
  price integer not null check (price >= 0),
  sale_price integer check (sale_price >= 0),
  images text[] not null default array[]::text[],
  sizes text[] not null default array[]::text[],
  size_stock jsonb not null default '[]'::jsonb,
  colors text[] not null default array[]::text[],
  color_stock jsonb not null default '[]'::jsonb,
  stock integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create unique index user_profiles_user_id_key on public.user_profiles (user_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  total integer not null check (total >= 0),
  status public.order_status not null default 'pending',
  shipping_address jsonb not null,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  name text not null,
  size text,
  color text,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  subtotal integer not null check (subtotal >= 0)
);

create index products_category_id_idx on public.products (category_id);
create index products_is_featured_idx on public.products (is_featured);
create index products_is_new_arrival_idx on public.products (is_new_arrival);
create index products_created_at_idx on public.products (created_at);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create index product_categories_category_id_idx on public.product_categories (category_id);
create index product_categories_product_id_idx on public.product_categories (product_id);

create index orders_user_id_idx on public.orders (user_id);
create index orders_created_at_idx on public.orders (created_at);
create index orders_status_idx on public.orders (status);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.user_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public read categories" on public.categories for select using (true);

create policy "Public read products" on public.products for select using (true);

create policy "Public read product categories" on public.product_categories
  for select
  using (true);

create policy "Users can view own profile" on public.user_profiles for select using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.user_profiles for insert with check (auth.uid() = user_id);

create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id or exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id or user_id is null);

create policy "Admins can update any order" on public.orders for update using (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Users can view own order items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'))));

create policy "Admins manage products" on public.products for all using (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Admins manage categories" on public.categories for all using (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Admins manage product categories" on public.product_categories
  for all
  using (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Users insert own order items" on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.user_id = auth.uid()
    )
  );

create policy "Public insert guest order items" on public.order_items
  for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id is null));

create policy "Public read guest orders" on public.orders
  for select
  using (user_id is null);

create policy "Public read guest order items" on public.order_items
  for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id is null));

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  hero_primary_label text,
  hero_primary_href text,
  hero_secondary_label text,
  hero_secondary_href text,
  hero_banner_text text,
  contact_email text,
  contact_phone text,
  contact_address_line1 text,
  contact_address_line2 text,
  contact_city text,
  contact_country text,
  contact_instagram_url text,
  contact_facebook_url text,
  contact_tiktok_url text,
  shipping_returns_content text,
  terms_content text,
  privacy_content text,
  shipping_flat_fee_cents integer not null default 0,
  hero_additional_image_urls text[] not null default array[]::text[],
  theme_key text,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public read site settings" on public.site_settings
  for select
  using (true);

create policy "Admins manage site settings" on public.site_settings
  for all
  using (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create index product_reviews_product_id_idx on public.product_reviews (product_id);

alter table public.product_reviews enable row level security;

create policy "Public read product reviews" on public.product_reviews
  for select
  using (true);

create policy "Users insert own reviews" on public.product_reviews
  for insert
  with check (auth.uid() = user_id);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  min_order_total_cents integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

create policy "Public read coupons" on public.coupons
  for select
  using (true);

create policy "Admins manage coupons" on public.coupons
  for all
  using (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create table public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid references public.user_profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.admin_activity_logs enable row level security;

create policy "Admins insert activity logs" on public.admin_activity_logs
  for insert
  with check (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins read activity logs" on public.admin_activity_logs
  for select
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create table public.brand_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  brand_name text,
  hero_image_url text,
  hero_video_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.brand_campaign_products (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.brand_campaigns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  highlight_badge text,
  outfit_note text
);

alter table public.brand_campaigns enable row level security;
alter table public.brand_campaign_products enable row level security;

create policy "Public read brand campaigns" on public.brand_campaigns
  for select
  using (is_active = true);

create policy "Public read brand campaign products" on public.brand_campaign_products
  for select
  using (
    exists (
      select 1 from public.brand_campaigns c
      where c.id = campaign_id and c.is_active = true
    )
  );

create policy "Admins manage brand campaigns" on public.brand_campaigns
  for all
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins manage brand campaign products" on public.brand_campaign_products
  for all
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );
