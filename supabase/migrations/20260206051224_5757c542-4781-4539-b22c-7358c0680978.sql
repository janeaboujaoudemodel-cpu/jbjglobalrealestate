-- Add RLS policy for studio_jobs to allow users to update their own jobs
-- This allows the client to mark jobs as complete via the studio-job-complete edge function

-- First, ensure user_id column is properly indexed
CREATE INDEX IF NOT EXISTS idx_studio_jobs_user_id ON public.studio_jobs(user_id);

-- Add policy for users to update their own jobs
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

-- Add policy to ensure users can only insert jobs for themselves
DROP POLICY IF EXISTS "Users can create jobs" ON public.studio_jobs;

CREATE POLICY "Users can create own jobs" 
ON public.studio_jobs 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  user_id IS NULL OR
  (input_data->>'userId')::uuid = auth.uid()
);