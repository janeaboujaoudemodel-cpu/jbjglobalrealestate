-- Lock down app_settings table - ONLY service_role can read directly
-- get_owner_email() function uses SECURITY DEFINER so RLS policies can still use it

-- 1. Revoke ALL from anon and authenticated on app_settings
REVOKE ALL ON public.app_settings FROM anon;
REVOKE ALL ON public.app_settings FROM authenticated;

-- 2. Grant only to service_role (for edge functions)
GRANT SELECT ON public.app_settings TO service_role;

-- 3. Enable RLS on app_settings if not already
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies on app_settings
DROP POLICY IF EXISTS "Allow public read of app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated read of app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_read" ON public.app_settings;

-- 5. Create restrictive policy - service_role only (for edge functions)
CREATE POLICY "app_settings_service_role_only"
  ON public.app_settings
  FOR SELECT
  TO service_role
  USING (true);

-- 6. Update get_owner_email function to be SECURITY DEFINER with proper search_path
-- This allows RLS policies to call it without needing direct table access
CREATE OR REPLACE FUNCTION public.get_owner_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'owner_email' LIMIT 1;
$$;

-- 7. REVOKE EXECUTE from anon/public, GRANT to authenticated (for RLS evaluation)
REVOKE EXECUTE ON FUNCTION public.get_owner_email() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_owner_email() FROM public;
GRANT EXECUTE ON FUNCTION public.get_owner_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_email() TO service_role;

-- 8. Ensure ai_job_master has proper RLS with dynamic owner override
DROP POLICY IF EXISTS "Users can view their own AI jobs" ON public.ai_job_master;
DROP POLICY IF EXISTS "Users can insert their own AI jobs" ON public.ai_job_master;
DROP POLICY IF EXISTS "Owner can view all AI jobs" ON public.ai_job_master;

CREATE POLICY "ai_job_master_user_select"
  ON public.ai_job_master
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ai_job_master_user_insert"
  ON public.ai_job_master
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_job_master_owner_select"
  ON public.ai_job_master
  FOR SELECT
  TO authenticated
  USING (auth.email() = public.get_owner_email());

-- 9. Revoke anon access to ai_job_master
REVOKE ALL ON public.ai_job_master FROM anon;
GRANT SELECT, INSERT ON public.ai_job_master TO authenticated;
GRANT ALL ON public.ai_job_master TO service_role;