
-- ============================================
-- PHASE 4 FIX #3: video_studio_jobs HARDENING
-- ============================================

-- A) DROP ALL INSECURE POLICIES (roles={public}, WITH CHECK true)
DROP POLICY IF EXISTS "Users can create jobs" ON public.video_studio_jobs;
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.video_studio_jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.video_studio_jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.video_studio_jobs;

-- B) CREATE STRICT AUTHENTICATED-ONLY POLICIES
-- INSERT: strict ownership enforcement
CREATE POLICY "video_studio_jobs_owner_insert"
  ON public.video_studio_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SELECT: owner or session-based access (authenticated only)
CREATE POLICY "video_studio_jobs_owner_select"
  ON public.video_studio_jobs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR session_id = (current_setting('request.headers', true)::json ->> 'x-session-id')
  );

-- UPDATE: owner or session-based access (authenticated only)
CREATE POLICY "video_studio_jobs_owner_update"
  ON public.video_studio_jobs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR session_id = (current_setting('request.headers', true)::json ->> 'x-session-id')
  );

-- DELETE: owner or session-based access (authenticated only)
CREATE POLICY "video_studio_jobs_owner_delete"
  ON public.video_studio_jobs
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR session_id = (current_setting('request.headers', true)::json ->> 'x-session-id')
  );

-- C) FORCE RLS
ALTER TABLE public.video_studio_jobs FORCE ROW LEVEL SECURITY;

-- D) user_id NOT NULL (safe: 0 rows in table)
ALTER TABLE public.video_studio_jobs ALTER COLUMN user_id SET NOT NULL;

-- E) PRIVILEGE HARDENING: Revoke anon/public, keep authenticated + service_role
REVOKE ALL ON TABLE public.video_studio_jobs FROM anon;
REVOKE ALL ON TABLE public.video_studio_jobs FROM public;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.video_studio_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.video_studio_jobs TO service_role;
