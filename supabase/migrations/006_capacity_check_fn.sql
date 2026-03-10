-- ──────────────────────────────────────────────────────────────────────────
-- Migration 006: Capacity check RPC + update max_guests default
-- Kanalla Sky Bar
-- ──────────────────────────────────────────────────────────────────────────
-- Updates the default max_guests to 10 (reservations of 10+ must call).
-- Also creates a SECURITY DEFINER function so public users can query
-- total booked guests within a ±1h window without bypassing RLS on purpose,
-- while still getting a safe, read-only answer.
-- ──────────────────────────────────────────────────────────────────────────

-- Update the default
update public.site_config
set value = '10'
where key = 'max_guests';

-- ── RPC: check_reservation_capacity ──────────────────────────────────────────
-- Returns a JSONB object:
--   { "available": true,  "booked": N, "max": M }
--   { "available": false, "reason": "per_reservation_limit", "max": M }
--   { "available": false, "reason": "capacity_full", "booked": N, "max": M }
--
-- p_date   — ISO date string  (e.g. '2026-05-01')
-- p_time   — HH:MM time string (e.g. '20:30')
-- p_guests — number of guests in the new reservation

create or replace function public.check_reservation_capacity(
  p_date   date,
  p_time   time,
  p_guests integer
)
returns jsonb
language plpgsql
security definer   -- runs as DB owner, bypasses RLS safely
stable
as $$
declare
  v_max_guests    integer;
  v_already_booked integer;
  v_window_start  time;
  v_window_end    time;
begin
  -- ── 1. Load the configured capacity limit ─────────────────────────────────
  select value::integer
  into   v_max_guests
  from   public.site_config
  where  key = 'max_guests';

  if v_max_guests is null or v_max_guests < 1 then
    v_max_guests := 10;
  end if;

  -- ── 2. Per-reservation hard cap (must call for groups >= max_guests) ───────
  if p_guests >= v_max_guests then
    return jsonb_build_object(
      'available', false,
      'reason',    'per_reservation_limit',
      'max',       v_max_guests
    );
  end if;

  -- ── 3. Total capacity check in a ±1h time window ──────────────────────────
  -- Clamp to 00:00..23:59 so we never wrap around midnight unexpectedly.
  v_window_start := greatest('00:00'::time, p_time - interval '1 hour');
  v_window_end   := least('23:59'::time,   p_time + interval '1 hour');

  select coalesce(sum(guests), 0)
  into   v_already_booked
  from   public.reservations
  where  date   = p_date
    and  time  >= v_window_start
    and  time  <= v_window_end
    and  status <> 'cancelled';

  if v_already_booked + p_guests > v_max_guests then
    return jsonb_build_object(
      'available', false,
      'reason',    'capacity_full',
      'booked',    v_already_booked,
      'max',       v_max_guests
    );
  end if;

  -- ── 4. All good ───────────────────────────────────────────────────────────
  return jsonb_build_object(
    'available', true,
    'booked',    v_already_booked,
    'max',       v_max_guests
  );
end;
$$;

-- Grant execution to both anon and authenticated roles
grant execute on function public.check_reservation_capacity(date, time, integer)
  to anon, authenticated;
