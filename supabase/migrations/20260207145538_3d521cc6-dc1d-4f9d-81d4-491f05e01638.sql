-- Clean up duplicate policies

-- Remove old duplicate ai_job_master policies
DROP POLICY IF EXISTS "Owner can read all AI jobs" ON public.ai_job_master;
DROP POLICY IF EXISTS "Users can update their own AI jobs" ON public.ai_job_master;
DROP POLICY IF EXISTS "Settings are readable by all" ON public.app_settings;