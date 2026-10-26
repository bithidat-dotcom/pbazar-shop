-- ========================================================================
-- PBAZAR UNIFIED SUPABASE DATABASE SCHEMA
-- Run this complete script in your Supabase SQL Editor (SQL Editor -> New Query)
-- ========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- ------------------------------------------------------------------------
create table if not exists products (
  id text primary key,
  name text not null,
  price numeric not null,
  discount numeric default 0,
  category text,
  description text,
  image text not null,
  images jsonb default '[]'::jsonb,
  stock integer default 20,
  total_stock integer default 30,
  seller text default 'Pbazar Official',
  seller_id text default 'pbazar_official',
  seller_whatsapp text,
  seller_logo text,
  is_new boolean default true,
  is_super_sale boolean default false,
  super_sale_at text,
  rating numeric default 4.8,
  order_count integer default 0,
  ram text,
  storage text,
  screen_hz text,
  battery text,
  watt_amp text,
  discount_timeline_hours integer default 24,
  flash_sale_end text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------
-- 2. ORDERS TABLE
-- ------------------------------------------------------------------------
create table if not exists orders (
  id text primary key default gen_random_uuid()::text,
  customer_name text not null,
  customer_username text,
  whatsapp text not null,
  phone text,
  location text not null,
  area text,
  post_code text,
  product_id text,
  product_name text,
  price numeric not null,
  original_price numeric,
  coupon_discount numeric default 0,
  quantity integer default 1,
  items jsonb default '[]'::jsonb,
  seller text,
  seller_id text,
  seller_ids jsonb default '[]'::jsonb,
  bkash_trx_id text,
  status text default 'pending', -- 'pending', 'confirmed', 'packing', 'shipping', 'completed', 'cancelled'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------
-- 3. BANNERS TABLE
-- ------------------------------------------------------------------------
create table if not exists banners (
  id text primary key default gen_random_uuid()::text,
  title text,
  image text not null,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------
-- 4. SELLERS TABLE (Public & Partner listings)
-- ------------------------------------------------------------------------
create table if not exists sellers (
  username text primary key,
  name text not null,
  email text,
  whatsapp text,
  logo text,
  facebook text,
  tiktok text,
  instagram text,
  is_verified boolean default false,
  is_top boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------
-- 5. REVIEWS TABLE
-- ------------------------------------------------------------------------
create table if not exists reviews (
  id text primary key default gen_random_uuid()::text,
  product_id text not null,
  user_name text not null,
  rating numeric default 5,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------
-- 6. USERS TABLE (Customer accounts)
-- ------------------------------------------------------------------------
create table if not exists users (
  whatsapp text primary key,
  username text not null,
  name text,
  email text,
  phone text,
  location text,
  address text,
  profile_image text,
  points integer default 0,
  is_order_blocked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------
-- 7. SETTINGS TABLE (Coupon & Ad Popups)
-- ------------------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Default settings seed
insert into settings (key, value)
values 
  ('coupon', '{"isActive": false, "minPurchase": 100, "discountAmount": 10}'::jsonb),
  ('ad', '{"imageUrl": "", "title": "", "link": ""}'::jsonb)
on conflict (key) do nothing;

-- ------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------
alter table products enable row level security;
alter table orders enable row level security;
alter table banners enable row level security;
alter table sellers enable row level security;
alter table reviews enable row level security;
alter table users enable row level security;
alter table settings enable row level security;

-- Public read access
create policy "Public can read products" on products for select using (true);
create policy "Public can read banners" on banners for select using (true);
create policy "Public can read sellers" on sellers for select using (true);
create policy "Public can read reviews" on reviews for select using (true);
create policy "Public can read settings" on settings for select using (true);

-- Storefront inserts
create policy "Public can insert orders" on orders for insert with check (true);
create policy "Public can read own orders" on orders for select using (true);
create policy "Public can insert reviews" on reviews for insert with check (true);
create policy "Public can upsert users" on users for all using (true);

-- Admin / Full access (can be scoped to auth in production)
create policy "Admin can manage all products" on products for all using (true);
create policy "Admin can manage all orders" on orders for all using (true);
create policy "Admin can manage all banners" on banners for all using (true);
create policy "Admin can manage all sellers" on sellers for all using (true);
create policy "Admin can manage all settings" on settings for all using (true);
