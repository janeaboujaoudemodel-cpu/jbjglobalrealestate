-- Fix the overly permissive "System can update jobs" policy on studio_jobs
-- This was flagged as a security issue (USING true on UPDATE)

DROP POLICY IF EXISTS "System can update jobs" ON public.studio_jobs;

-- Replace with proper admin-only system update policy
-- Only service role / admins should update all jobs
CREATE POLICY "Admins can update all jobs"
ON public.studio_jobs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));