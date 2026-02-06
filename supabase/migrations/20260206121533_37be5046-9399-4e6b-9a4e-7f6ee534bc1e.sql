-- =============================================
-- FINAL HARDENING: Remove legacy fallbacks + enforce NOT NULL
-- Since legacy_rows = 0, we can simplify to user_id-only model
-- =============================================

-- 1) Remove legacy claim UPDATE policy
DROP POLICY IF EXISTS "Users can claim legacy jobs (set user_id)" ON public.studio_jobs;

-- 2) Tighten SELECT to user_id only (remove input_data fallback)
DROP POLICY IF EXISTS "Users can view own jobs" ON public.studio_jobs;

CREATE POLICY "Users can view own jobs"
ON public.studio_jobs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3) Enforce NOT NULL on user_id to prevent future orphan jobs
ALTER TABLE public.studio_jobs
ALTER COLUMN user_id SET NOT NULL;