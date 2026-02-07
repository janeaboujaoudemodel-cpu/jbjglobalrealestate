-- AI Job Master Table for tracking all AI tool usage
-- User-owned data with strict RLS

CREATE TABLE IF NOT EXISTS public.ai_job_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload JSONB,
  error_message TEXT,
  intelligence_features JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_job_master_user_id ON public.ai_job_master(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_master_tool_name ON public.ai_job_master(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_job_master_created_at ON public.ai_job_master(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_job_master ENABLE ROW LEVEL SECURITY;

-- Revoke all from anon - anonymous users cannot access this table
REVOKE ALL ON public.ai_job_master FROM anon;

-- Grant to authenticated users
GRANT SELECT, INSERT ON public.ai_job_master TO authenticated;

-- Grant full access to service_role (for edge functions)
GRANT ALL ON public.ai_job_master TO service_role;

-- RLS Policy 1: Users can only see their own AI jobs
CREATE POLICY "Users can view their own AI jobs"
ON public.ai_job_master
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy 2: Users can only insert their own AI jobs
CREATE POLICY "Users can insert their own AI jobs"
ON public.ai_job_master
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Owner can read all AI jobs (read-only override)
CREATE POLICY "Owner can read all AI jobs"
ON public.ai_job_master
FOR SELECT
TO authenticated
USING (
  auth.email() = 'janeaboujaoudenails@gmail.com'
);

-- Add comment documenting the data ownership policy
COMMENT ON TABLE public.ai_job_master IS 'AI job tracking table. USER DATA OWNERSHIP: All outputs stored under user_id = auth.uid(). Never visible to other users. Owner has read-only visibility for audit/support.';