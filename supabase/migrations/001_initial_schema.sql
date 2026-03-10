-- ──────────────────────────────────────────────────────────────────────────
-- Migration 001: Initial Schema
-- Kanalla Sky Bar — Database
-- ──────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── admin_users ──────────────────────────────────────────────────────────────
-- Links a Supabase Auth user (email/password) to the worker/admin role.
-- Workers are created manually in the Supabase Auth dashboard.
create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Workers/admins. Create an auth user first, then insert here to grant access.';

-- ── reservations ─────────────────────────────────────────────────────────────
create type reservation_status as enum ('pending', 'confirmed', 'cancelled');

create table if not exists public.reservations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text not null,
  date       date not null,
  time       time not null,
  guests     smallint not null check (guests between 1 and 20),
  notes      text,
  status     reservation_status not null default 'pending',
  created_at timestamptz not null default now()
);

comment on table public.reservations is
  'Customer booking requests. Public INSERT, admin-only read/update.';

-- Index for common dashboard queries
create index if not exists reservations_date_idx on public.reservations (date);
create index if not exists reservations_status_idx on public.reservations (status);

-- ── site_config ───────────────────────────────────────────────────────────────
-- Simple key-value store for site-wide settings managed from the admin panel.
create table if not exists public.site_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

comment on table public.site_config is
  'Site-wide configuration key-value store (e.g. menu_pdf_url, hero_image_url).';

-- Seed default config values
insert into public.site_config (key, value) values
  ('menu_pdf_url',    ''),
  ('hero_image_url',  ''),
  ('opening_hours',   'Lun–Vie: 13:00–23:00 | Sáb–Dom: 13:00–00:00')
on conflict (key) do nothing;

-- ── Supabase Storage ─────────────────────────────────────────────────────────
-- Run this in the Supabase Dashboard → Storage, or via CLI:
--   supabase storage buckets create menu-pdf --public
-- The bucket is PUBLIC (read). Write access is restricted by RLS.
-- (Storage bucket creation via SQL is not supported; use CLI or Dashboard.)
