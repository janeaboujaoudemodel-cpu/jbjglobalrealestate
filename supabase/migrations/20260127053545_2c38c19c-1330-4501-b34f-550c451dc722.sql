-- Fix permissive RLS policies - add proper checks

-- 1. scraping_blocks - should only allow service role or admins to insert
DROP POLICY IF EXISTS "scraping_blocks_service_insert" ON public.scraping_blocks;
CREATE POLICY "scraping_blocks_restricted_insert" ON public.scraping_blocks
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'admin')
  );

-- 2. vapi_call_logs - restrict to owner/service operations  
DROP POLICY IF EXISTS "vapi_call_logs_service_update" ON public.vapi_call_logs;
CREATE POLICY "vapi_call_logs_owner_update" ON public.vapi_call_logs
  FOR UPDATE USING (public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "vapi_call_logs_service_insert" ON public.vapi_call_logs;
CREATE POLICY "vapi_call_logs_owner_insert" ON public.vapi_call_logs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Note: security_access_audit INSERT with true is intentional for system logging