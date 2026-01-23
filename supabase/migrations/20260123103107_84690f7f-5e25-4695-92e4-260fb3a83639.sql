-- Fix the permissive INSERT policy on salary_access_logs
-- Only allow users to log their own access (prevents spoofing)

DROP POLICY IF EXISTS "Allow audit inserts" ON public.salary_access_logs;

CREATE POLICY "Self-logging only"
ON public.salary_access_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());