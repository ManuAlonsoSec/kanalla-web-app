-- ──────────────────────────────────────────────────────────────────────────
-- Migration 005: Seed max_guests config key
-- Kanalla Sky Bar
-- ──────────────────────────────────────────────────────────────────────────
-- Adds a default value for the maximum number of guests per reservation.
-- The admin can change this at any time from the admin panel.
-- ──────────────────────────────────────────────────────────────────────────

insert into public.site_config (key, value)
values ('max_guests', '20')
on conflict (key) do nothing;
