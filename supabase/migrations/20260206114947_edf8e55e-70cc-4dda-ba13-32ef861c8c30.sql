-- =============================================
-- FIX UPDATE POLICY REASSIGNMENT VULNERABILITY
-- Split into strict + legacy-claim policies
-- =============================================

-- Remove the combined UPDATE policies that allow reassignment
DROP POLICY IF EXISTS "Users can update own jobs" ON public.studio_jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.studio_jobs;

-- 1) STRICT: Owner (user_id) can update, cannot change user_id away from self
CREATE POLICY "Users can update jobs they own (strict)"
ON public.studio_jobs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2) LEGACY CLAIM: Rows with user_id NULL can be updated only if input_data.userId matches,
-- AND the update MUST set user_id = auth.uid() (migrates ownership, prevents reassignment)
CREATE POLICY "Users can claim legacy jobs (set user_id)"
ON public.studio_jobs
FOR UPDATE
TO authenticated
USING (
  user_id IS NULL
  AND (input_data->>'userId') IS NOT NULL
  AND (input_data->>'userId')::uuid = auth.uid()
)
WITH CHECK (user_id = auth.uid());

-- 3) ADMIN: Can update any job
CREATE POLICY "Admins can update all jobs"
ON public.studio_jobs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FORCE RLS to prevent table owner bypass
ALTER TABLE public.studio_jobs FORCE ROW LEVEL SECURITY;