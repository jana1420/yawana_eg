insert into public.categories (name, slug, is_featured)
values
  ('T-Shirts', 't-shirts', true),
  ('Shirts', 'shirts', true),
  ('Trousers', 'trousers', false)
  on conflict (slug) do nothing;

insert into public.products (name, slug, description, price, images, stock, is_featured, category_id)
select
  'Organic Cotton Tee',
  'organic-cotton-tee',
  'Soft, lightweight crew neck in organic cotton.',
  2900,
  array['https://images.pexels.com/photos/7691088/pexels-photo-7691088.jpeg'],
  24,
  true,
  (select id from public.categories where slug = 't-shirts')
where
  not exists (
    select 1 from public.products where slug = 'organic-cotton-tee'
  );

insert into public.products (name, slug, description, price, images, stock, is_featured, category_id)
select
  'Relaxed Linen Shirt',
  'relaxed-linen-shirt',
  'Breathable linen shirt with a relaxed fit.',
  5900,
  array['https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg'],
  12,
  true,
  (select id from public.categories where slug = 'shirts')
where
  not exists (
    select 1 from public.products where slug = 'relaxed-linen-shirt'
  );

insert into public.products (name, slug, description, price, images, stock, is_featured, category_id)
select
  'Tapered Cotton Trousers',
  'tapered-cotton-trousers',
  'Slightly tapered cotton trousers with a clean line.',
  7500,
  array['https://images.pexels.com/photos/7671211/pexels-photo-7671211.jpeg'],
  18,
  false,
  (select id from public.categories where slug = 'trousers')
where
  not exists (
    select 1 from public.products where slug = 'tapered-cotton-trousers'
  );
