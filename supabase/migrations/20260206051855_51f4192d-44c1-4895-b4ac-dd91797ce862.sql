-- Fix RLS policies for studio_jobs
-- Remove the insecure user_id IS NULL clause from INSERT policy

-- Drop existing policies that we're replacing
DROP POLICY IF EXISTS "Users can create own jobs" ON public.studio_jobs;
DROP POLICY IF EXISTS "Users can create jobs" ON public.studio_jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.studio_jobs;

-- Strict INSERT policy: user_id MUST equal auth.uid() (no NULL allowed)
CREATE POLICY "Users can create own jobs"
ON public.studio_jobs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE policy: allow updating own jobs (check both user_id and legacy input_data.userId)
CREATE POLICY "Users can update own jobs"
ON public.studio_jobs
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  (input_data->>'userId')::uuid = auth.uid()
)
WITH CHECK (
  user_id = auth.uid() OR 
  (input_data->>'userId')::uuid = auth.uid()
);

-- SELECT policy is already correct (kept as-is)
-- "Users can view own jobs" allows SELECT where user_id = auth.uid() OR session_id IS NOT NULL