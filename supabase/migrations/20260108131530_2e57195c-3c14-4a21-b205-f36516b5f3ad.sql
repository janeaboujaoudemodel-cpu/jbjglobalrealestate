-- Fix overly permissive RLS policies

-- 1. Fix ai_usage_logs: Restrict inserts to authenticated users or require valid function_name
DROP POLICY IF EXISTS "Service role can insert AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Authenticated users can insert AI usage logs"
ON public.ai_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (
  function_name IS NOT NULL AND 
  function_name <> '' AND
  model IS NOT NULL
);

-- 2. Fix audit_logs: Restrict inserts to authenticated users with valid data
DROP POLICY IF EXISTS "audit_logs_insert_service" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  action_type IS NOT NULL AND
  resource_type IS NOT NULL AND
  description IS NOT NULL AND
  description <> ''
);

-- 3. Fix pwa_analytics: Add validation for anonymous inserts
DROP POLICY IF EXISTS "Anyone can insert PWA analytics" ON public.pwa_analytics;
CREATE POLICY "PWA analytics insert with validation"
ON public.pwa_analytics
FOR INSERT
WITH CHECK (
  event_type IS NOT NULL AND
  event_type <> '' AND
  event_type IN ('button_click', 'prompt_shown', 'install_accepted', 'install_dismissed', 'app_opened', 'app_closed', 'uninstall') AND
  platform IS NOT NULL
);