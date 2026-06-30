-- =============================================
-- REDLINE STOK TAKİP SİSTEMİ - v2 Schema
-- =============================================

-- Ürün Türleri
create table product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean default true,
  created_at timestamptz default now()
);

-- Uygulama Kullanıcıları (çalışanlar + admin)
create table app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'calisan')),
  active boolean default true,
  created_at timestamptz default now()
);

-- Müşteriler (dışarı satış carisi)
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Ürünler
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type_id uuid references product_types(id),
  barcode text unique,
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Stok (ürün + depo bazlı miktar)
create table stock_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) not null,
  depo text not null,
  qty integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(product_id, depo)
);

-- Stok Hareketleri (giriş/çıkış geçmişi)
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) not null,
  depo text not null,
  movement_type text not null check (movement_type in ('giris', 'cikis')),
  qty integer not null,
  -- Çıkış detayları
  exit_type text check (exit_type in ('satis', 'ic_kullanim')),
  customer_id uuid references customers(id),
  employee_id uuid references app_users(id),
  -- Genel
  note text,
  user_email text,
  created_at timestamptz default now()
);

-- =============================================
-- RLS Policies
-- =============================================
alter table product_types enable row level security;
alter table app_users enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table stock_items enable row level security;
alter table stock_movements enable row level security;

create policy "auth_all" on product_types for all to authenticated using (true) with check (true);
create policy "auth_all" on app_users for all to authenticated using (true) with check (true);
create policy "auth_all" on customers for all to authenticated using (true) with check (true);
create policy "auth_all" on products for all to authenticated using (true) with check (true);
create policy "auth_all" on stock_items for all to authenticated using (true) with check (true);
create policy "auth_all" on stock_movements for all to authenticated using (true) with check (true);

-- =============================================
-- İlk veriler
-- =============================================
insert into product_types (name, active) values
  ('Şampuan', true),
  ('Boya', true),
  ('Manikür', true),
  ('Diğer', true);

insert into app_users (email, name, role) values
  ('admin@redline.com', 'Admin', 'admin'),
  ('rabia@redline.com', 'Rabia', 'calisan'),
  ('harun@redline.com', 'Harun', 'calisan'),
  ('56kasa@redline.com', '56Kasa', 'calisan'),
  ('anil@redline.com', 'Anıl', 'calisan');

-- Storage policy (ürün resimleri için)
-- Not: product-images bucket'ı Supabase Dashboard'dan public olarak oluşturulmalı
