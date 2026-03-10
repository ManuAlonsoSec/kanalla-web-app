-- ──────────────────────────────────────────────────────────────────────────
-- Migration 003: Storage RLS Policies — menu-pdf bucket
-- Kanalla Sky Bar
--
-- PREREQUISITE: The bucket must already exist. Create it once via:
--   Dashboard → Storage → New bucket → Name: "menu-pdf" → Public: ON
--   OR: npx supabase storage buckets create menu-pdf --public
--
-- Storage RLS lives on the storage.objects table, scoped by bucket_id.
-- The is_admin() helper defined in 002 is reused here.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1. Public read (anyone can download the PDF, no auth required) ─────────
create policy "menu-pdf: public select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-pdf');

-- ── 2. Admin upload / replace (INSERT) ────────────────────────────────────
create policy "menu-pdf: admin insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'menu-pdf'
    and public.is_admin()
  );

-- ── 3. Admin update metadata (UPDATE) ─────────────────────────────────────
create policy "menu-pdf: admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'menu-pdf'
    and public.is_admin()
  )
  with check (
    bucket_id = 'menu-pdf'
    and public.is_admin()
  );

-- ── 4. Admin delete ────────────────────────────────────────────────────────
create policy "menu-pdf: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'menu-pdf'
    and public.is_admin()
  );
