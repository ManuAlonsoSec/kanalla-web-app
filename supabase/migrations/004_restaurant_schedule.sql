-- ──────────────────────────────────────────────────────────────────────────
-- Migration 004: Restaurant Schedule
-- Kanalla Sky Bar — Weekly Schedule Settings
-- ──────────────────────────────────────────────────────────────────────────
-- Each row represents one day of the week.
-- day_of_week: 0 = Monday … 6 = Sunday (ISO-style offset to start on Monday)
-- Each day has two optional shifts (shift_1 and shift_2).
-- If is_closed is true the shifts are ignored in the frontend.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.restaurant_schedule (
  day_of_week      smallint    primary key check (day_of_week between 0 and 6),
  is_closed        boolean     not null default false,

  -- Shift 1
  shift1_start     time,
  shift1_end       time,

  -- Shift 2 (optional — leave null to disable)
  shift2_start     time,
  shift2_end       time,

  updated_at       timestamptz not null default now()
);

comment on table public.restaurant_schedule is
  'Weekly opening schedule. One row per day of the week (0=Monday … 6=Sunday).';

comment on column public.restaurant_schedule.day_of_week is
  '0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday';

-- Seed default schedule (Mon–Thu: 13–17 & 20–23 | Fri–Sat: 13–17 & 20–00 | Sun: closed)
insert into public.restaurant_schedule
  (day_of_week, is_closed, shift1_start, shift1_end, shift2_start, shift2_end)
values
  (0, false, '13:00', '17:00', '20:00', '23:00'),  -- Monday
  (1, false, '13:00', '17:00', '20:00', '23:00'),  -- Tuesday
  (2, false, '13:00', '17:00', '20:00', '23:00'),  -- Wednesday
  (3, false, '13:00', '17:00', '20:00', '23:00'),  -- Thursday
  (4, false, '13:00', '17:00', '20:00', '00:00'),  -- Friday
  (5, false, '13:00', '17:00', '20:00', '00:00'),  -- Saturday
  (6, true,  null,    null,    null,    null)       -- Sunday (closed)
on conflict (day_of_week) do nothing;

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.restaurant_schedule enable row level security;

-- Public users can read the schedule (e.g. to show opening hours on the site)
create policy "schedule: public select"
  on public.restaurant_schedule for select
  to anon, authenticated
  using (true);

-- Only admins can modify the schedule
create policy "schedule: admin insert"
  on public.restaurant_schedule for insert
  with check (public.is_admin());

create policy "schedule: admin update"
  on public.restaurant_schedule for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "schedule: admin delete"
  on public.restaurant_schedule for delete
  using (public.is_admin());

-- ── Trigger: auto-update updated_at on every change ──────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schedule_updated_at
  before update on public.restaurant_schedule
  for each row execute function public.set_updated_at();
