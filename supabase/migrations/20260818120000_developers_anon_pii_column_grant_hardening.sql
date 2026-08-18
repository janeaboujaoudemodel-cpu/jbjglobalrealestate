-- JBJ-032: developers table — anonymous public API exposure of internal/admin-only
-- columns (admin_email, office_phone, whatsapp, notes, enrichment_source,
-- last_enriched_at).
--
-- The base table's SELECT policy ("Developers are viewable by everyone", USING (true))
-- is intentionally public — the developer catalog itself is meant to be readable by
-- anonymous visitors. Since Postgres RLS is row-level, not column-level, the sensitive
-- columns above have instead been restricted via column-level GRANT/REVOKE against the
-- `anon` role (see 20260524113700, 20260710100918, 20260710175658, 20260712221701,
-- 20260720171520). That history shows real whiplash: two full
-- `GRANT SELECT ON public.developers TO anon` resets (20260712191914, 20260713100818)
-- silently re-exposed every column, including these, before the restriction was
-- reapplied. The frontend's own public-safe column list
-- (DEVELOPERS_PUBLIC_SELECT in src/hooks/useProjects.ts) never reads any of the
-- blocked columns, so tightening this does not change what any public page renders.
--
-- This migration re-asserts the restriction idempotently, using a maintained
-- blocklist of internal-only columns instead of a hand-maintained allowlist — new
-- non-sensitive columns added later stay publicly readable without a follow-up
-- migration, and it self-heals if the live database's grants have drifted from what
-- the migration history above implies (e.g. a manual dashboard change).
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name NOT IN (
      'admin_email',
      'office_phone',
      'whatsapp',
      'notes',
      'enrichment_source',
      'last_enriched_at'
    );

  EXECUTE 'REVOKE SELECT ON public.developers FROM anon';
  EXECUTE format('GRANT SELECT (%s) ON public.developers TO anon', cols);
END $$;

-- authenticated/service_role keep full-table access via their existing grants
-- (GRANT SELECT ON public.developers TO authenticated; GRANT ALL ... TO service_role;
-- both already in effect from 20260710175658 / 20260712191914) — unchanged here.
