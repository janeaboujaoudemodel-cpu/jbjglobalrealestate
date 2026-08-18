-- Backend audit (Aug 17, 2026) — Phase 2 schema hardening.
--
-- Covers audit findings 3.4 (cascade-delete risk on developers → projects)
-- and 3.2 (user_sessions UPDATE ownership check, re-asserted idempotently).
--
-- Everything here is idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- 3.4 — developers → projects must not cascade.
--
-- `projects.developer_id` shipped as ON DELETE CASCADE, so deleting one row
-- from the small, high-value `developers` table silently wiped every project
-- under it AND — via the projects → project_images / project_documents
-- cascades — every image and document beneath those. One mis-click in an
-- admin table destroyed an entire developer's catalogue with no recovery
-- path.
--
-- The newer `rel_*` CRM module already uses ON DELETE SET NULL for the
-- equivalent link (see 20260504141024, `rel_listings.project_id` /
-- `rel_deals.project_id`); this brings the original tables in line.
-- `projects.developer_id` is nullable, so SET NULL is valid: an orphaned
-- project survives as an editable row that can be re-pointed at the right
-- developer, instead of vanishing.
--
-- The projects → project_images / project_documents cascades are left as
-- CASCADE deliberately: deleting a project *should* remove its own media.
-- The risk was the one-step jump from a developer to that media, and
-- breaking the top link is what closes it.
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT c.conname
    INTO v_constraint
    FROM pg_constraint c
    JOIN pg_class t       ON t.oid = c.conrelid
    JOIN pg_namespace n   ON n.oid = t.relnamespace
    JOIN pg_class reft    ON reft.oid = c.confrelid
   WHERE c.contype   = 'f'
     AND n.nspname   = 'public'
     AND t.relname   = 'projects'
     AND reft.relname = 'developers'
     AND c.conkey = ARRAY[
       (SELECT a.attnum FROM pg_attribute a
         WHERE a.attrelid = t.oid AND a.attname = 'developer_id')
     ]
   LIMIT 1;

  IF v_constraint IS NULL THEN
    RAISE NOTICE 'projects → developers FK not found; nothing to alter';
  ELSE
    EXECUTE format('ALTER TABLE public.projects DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'Dropped % on public.projects', v_constraint;
  END IF;

  -- Recreate under a stable, explicit name with the safe delete rule.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_developer_id_fkey_set_null'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_developer_id_fkey_set_null
      FOREIGN KEY (developer_id)
      REFERENCES public.developers(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Orphaned projects (developer_id IS NULL) must stay findable in admin views,
-- otherwise a SET NULL is just a slower disappearance.
CREATE INDEX IF NOT EXISTS idx_projects_developer_id_null
  ON public.projects (updated_at DESC)
  WHERE developer_id IS NULL;

-- ---------------------------------------------------------------------------
-- 3.2 — user_sessions UPDATE ownership check.
--
-- The original policy (20260221232553, "Anyone can update own session") was
-- `FOR UPDATE USING (true)` — any caller could modify any user's session row.
-- That was already corrected in 20260706161023. This block re-asserts the
-- correct policy idempotently so the end state is explicit in one place and
-- cannot be silently regressed by a later migration that only recreates the
-- INSERT policy (as 20260810132125 did).
DROP POLICY IF EXISTS "Anyone can update own session" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_session_update" ON public.user_sessions;
DROP POLICY IF EXISTS user_sessions_update_v2 ON public.user_sessions;

CREATE POLICY user_sessions_update_v2 ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Audit note (no DDL) — finding 3.3, rel_listings / rel_projects / rel_deals
-- "RLS enabled but no policies".
--
-- Re-verified: this was a false positive in the audit's static sweep. Those
-- tables DO have policies. They are created in 20260504141024 inside a
-- `DO $$ ... EXECUTE format(...)` loop over a table-name array, so a grep for
-- `CREATE POLICY ... ON public.rel_listings` finds nothing. Each of the twelve
-- rel_* tables gets `rel_auth_read_<table>` (SELECT to authenticated) and
-- `rel_owner_write_<table>` (ALL, gated by public.rel_is_owner()).
--
-- The verification query, for anyone re-checking against the live catalogue:
--   SELECT tablename, policyname, cmd
--     FROM pg_policies
--    WHERE schemaname = 'public' AND tablename LIKE 'rel\_%'
--    ORDER BY tablename, policyname;
