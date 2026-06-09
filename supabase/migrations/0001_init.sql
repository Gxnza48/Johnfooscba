-- ============================================================================
--  JOHN FOOS — Esquema inicial (catálogo + admin)
--  Ejecutar en: Supabase -> SQL Editor (o supabase db push)
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
--  Función para mantener updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
--  TABLA: settings (fila única id = 1)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  id                integer primary key default 1,
  store_name        text    not null default 'John Foos CBA',
  store_subtitle    text    not null default 'CARRITO DE COMPRAS',
  whatsapp_number   text    not null default '5493518009990',
  show_offer_banner boolean not null default false,
  offer_banner_text text    not null default '',
  currency_symbol   text    not null default '$',
  updated_at        timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
--  TABLA: products
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  code        text    not null default '',
  name        text    not null default '',
  price       numeric(12,2) not null default 0,
  offer_price numeric(12,2),
  is_offer    boolean not null default false,
  is_active   boolean not null default true,
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_products_active     on public.products (is_active);
create index if not exists idx_products_sort        on public.products (sort_order);

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
--  TABLA: product_sizes (talles + stock en pares)
-- ----------------------------------------------------------------------------
create table if not exists public.product_sizes (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null,
  stock      integer not null default 0,
  unique (product_id, size)
);

create index if not exists idx_sizes_product on public.product_sizes (product_id);

-- ----------------------------------------------------------------------------
--  ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.settings      enable row level security;
alter table public.products      enable row level security;
alter table public.product_sizes enable row level security;

-- settings: lectura pública, escritura solo autenticados (admin)
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read
  on public.settings for select
  to anon, authenticated
  using (true);

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write
  on public.settings for all
  to authenticated
  using (true) with check (true);

-- products: el público ve solo activos; el admin ve y edita todo
drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products for select
  to anon
  using (is_active = true);

drop policy if exists products_admin_read on public.products;
create policy products_admin_read
  on public.products for select
  to authenticated
  using (true);

drop policy if exists products_admin_write on public.products;
create policy products_admin_write
  on public.products for all
  to authenticated
  using (true) with check (true);

-- product_sizes: el público ve talles de productos activos; el admin todo
drop policy if exists sizes_public_read on public.product_sizes;
create policy sizes_public_read
  on public.product_sizes for select
  to anon
  using (
    exists (
      select 1 from public.products p
      where p.id = product_sizes.product_id and p.is_active = true
    )
  );

drop policy if exists sizes_admin_read on public.product_sizes;
create policy sizes_admin_read
  on public.product_sizes for select
  to authenticated
  using (true);

drop policy if exists sizes_admin_write on public.product_sizes;
create policy sizes_admin_write
  on public.product_sizes for all
  to authenticated
  using (true) with check (true);

-- ----------------------------------------------------------------------------
--  GRANTS (RLS sigue gobernando el acceso por fila)
-- ----------------------------------------------------------------------------
grant select on public.settings, public.products, public.product_sizes to anon, authenticated;
grant insert, update, delete on public.settings, public.products, public.product_sizes to authenticated;

-- ----------------------------------------------------------------------------
--  STORAGE: bucket público para fotos de productos
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- ----------------------------------------------------------------------------
--  SEED: fila de configuración con el número de WhatsApp nuevo
-- ----------------------------------------------------------------------------
insert into public.settings (id, store_name, store_subtitle, whatsapp_number, currency_symbol)
values (1, 'John Foos CBA', 'CARRITO DE COMPRAS', '5493518009990', '$')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  SEED OPCIONAL: productos de ejemplo (los podés borrar desde /admin)
-- ----------------------------------------------------------------------------
do $$
declare
  p1 uuid; p2 uuid; p3 uuid; p4 uuid;
begin
  if not exists (select 1 from public.products) then
    insert into public.products (code, name, price, offer_price, is_offer, sort_order)
      values ('1761328', '176 MEET NEW GREY', 50000, null, false, 1) returning id into p1;
    insert into public.products (code, name, price, offer_price, is_offer, sort_order)
      values ('1761913', '176 MEET 21 BLACK', 50000, 45000, true, 2) returning id into p2;
    insert into public.products (code, name, price, offer_price, is_offer, sort_order)
      values ('1761914', '176 MEET 21 GREY', 50000, null, false, 3) returning id into p3;
    insert into public.products (code, name, price, offer_price, is_offer, sort_order)
      values ('1761915', '176 MEET 21 BLUE', 50000, null, false, 4) returning id into p4;

    insert into public.product_sizes (product_id, size, stock) values
      (p1,'37',8),(p1,'38',5),(p1,'39',3),(p1,'40',6),
      (p2,'35',1),(p2,'36',14),(p2,'37',8),(p2,'39',1),(p2,'40',1),(p2,'41',1),(p2,'44',1),
      (p3,'38',4),(p3,'39',2),(p3,'40',5),(p3,'41',3),
      (p4,'37',2),(p4,'38',6),(p4,'39',4),(p4,'40',1);
  end if;
end $$;
