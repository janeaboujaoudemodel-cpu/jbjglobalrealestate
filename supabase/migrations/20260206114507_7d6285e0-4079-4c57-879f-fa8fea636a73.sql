-- =============================================
-- FINAL STUDIO_JOBS RLS HARDENING
-- Complete lockdown with null-safe checks
-- =============================================

-- 1) SELECT: Owner-only with null-safe input_data check
DROP POLICY IF EXISTS "Users can view own jobs" ON public.studio_jobs;

CREATE POLICY "Users can view own jobs"
ON public.studio_jobs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    (input_data->>'userId') IS NOT NULL
    AND (input_data->>'userId')::uuid = auth.uid()
  )
);

-- 2) SELECT: Admin access (already exists but recreate for consistency)
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.studio_jobs;

CREATE POLICY "Admins can view all jobs"
ON public.studio_jobs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) UPDATE: Owner-only with USING + WITH CHECK (prevents reassignment)
DROP POLICY IF EXISTS "Users can update own jobs" ON public.studio_jobs;
DROP POLICY IF EXISTS "Owners can update their jobs" ON public.studio_jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.studio_jobs;

CREATE POLICY "Users can update own jobs"
ON public.studio_jobs
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    (input_data->>'userId') IS NOT NULL
    AND (input_data->>'userId')::uuid = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR (
    (input_data->>'userId') IS NOT NULL
    AND (input_data->>'userId')::uuid = auth.uid()
  )
);

-- Admin update access
CREATE POLICY "Admins can update all jobs"
ON public.studio_jobs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) INSERT: Strict owner-only (no null user_id allowed by policy)
DROP POLICY IF EXISTS "Users can create own jobs" ON public.studio_jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.studio_jobs;

CREATE POLICY "Users can create own jobs"
ON public.studio_jobs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 5) DELETE: Owner-only (explicit control)
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.studio_jobs;

CREATE POLICY "Users can delete own jobs"
ON public.studio_jobs
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admin delete access
CREATE POLICY "Admins can delete all jobs"
ON public.studio_jobs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));