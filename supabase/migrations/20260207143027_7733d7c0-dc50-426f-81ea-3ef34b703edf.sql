-- Fix Owner Override Policy to use settings table instead of hardcoded email
-- Using a dedicated table is more reliable than database parameters

-- First, drop the existing hardcoded policy
DROP POLICY IF EXISTS "Owner can read all AI jobs" ON ai_job_master;

-- Create app_settings table as single source of truth for configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert owner email setting (single source of truth)
INSERT INTO public.app_settings (key, value, description)
VALUES ('owner_email', 'janeaboujaoudenails@gmail.com', 'Owner email for privilege checks')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Enable RLS on app_settings (public read, no write from clients)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for RLS policies to work)
CREATE POLICY "Settings are readable by all" ON public.app_settings
FOR SELECT USING (true);

-- No one can modify settings via client (admin only via migrations)
-- No INSERT/UPDATE/DELETE policies = denied

-- Revoke direct modifications
REVOKE INSERT, UPDATE, DELETE ON public.app_settings FROM anon, authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;

-- Create function to get owner email from settings table
CREATE OR REPLACE FUNCTION public.get_owner_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'owner_email' LIMIT 1;
$$;

-- Create the new owner override policy using the function
CREATE POLICY "Owner can read all AI jobs"
ON ai_job_master
FOR SELECT
USING (auth.email() = public.get_owner_email());

-- Ensure the policies for user isolation are correct
DROP POLICY IF EXISTS "Users can view their own AI jobs" ON ai_job_master;
DROP POLICY IF EXISTS "Users can insert their own AI jobs" ON ai_job_master;
DROP POLICY IF EXISTS "Users can update their own AI jobs" ON ai_job_master;

-- User can only SELECT their own jobs
CREATE POLICY "Users can view their own AI jobs"
ON ai_job_master
FOR SELECT
USING (auth.uid() = user_id);

-- User can only INSERT jobs for themselves
CREATE POLICY "Users can insert their own AI jobs"
ON ai_job_master
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User can only UPDATE their own jobs
CREATE POLICY "Users can update their own AI jobs"
ON ai_job_master
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE ai_job_master ENABLE ROW LEVEL SECURITY;

-- Ensure anon cannot access ai_job_master
REVOKE ALL ON ai_job_master FROM anon;

-- Grant authenticated users access (RLS will filter)
GRANT SELECT, INSERT, UPDATE ON ai_job_master TO authenticated;