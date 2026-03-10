-- ──────────────────────────────────────────────────────────────────────────
-- Migration 002: Row Level Security Policies
-- Kanalla Sky Bar — RLS
-- ──────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.admin_users  enable row level security;
alter table public.reservations enable row level security;
alter table public.site_config  enable row level security;

-- ── Helper function: is the current user an admin? ───────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

-- ── admin_users policies ─────────────────────────────────────────────────────
-- Admins can only see their own row
create policy "admin_users: select own row"
  on public.admin_users for select
  using (user_id = auth.uid());

-- ── reservations policies ─────────────────────────────────────────────────────
-- Anyone (including unauthenticated visitors) can create a reservation
create policy "reservations: public insert"
  on public.reservations for insert
  to anon, authenticated
  with check (true);

-- Only admins can read all reservations
create policy "reservations: admin select"
  on public.reservations for select
  using (public.is_admin());

-- Only admins can update reservation status
create policy "reservations: admin update"
  on public.reservations for update
  using (public.is_admin())
  with check (public.is_admin());

-- Only admins can delete reservations
create policy "reservations: admin delete"
  on public.reservations for delete
  using (public.is_admin());

-- ── site_config policies ──────────────────────────────────────────────────────
-- Public read (used to load menu PDF URL in the Angular app)
create policy "site_config: public select"
  on public.site_config for select
  to anon, authenticated
  using (true);

-- Only admins can modify config
create policy "site_config: admin insert"
  on public.site_config for insert
  with check (public.is_admin());

create policy "site_config: admin update"
  on public.site_config for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "site_config: admin delete"
  on public.site_config for delete
  using (public.is_admin());
