-- ======================================================
-- SECURITY FIX: Remove remaining overly permissive RLS policy
-- vapi_call_logs has WITH CHECK (true) for INSERT which is 
-- overly permissive - only service_role should write to this
-- ======================================================

-- Drop the overly permissive webhook insert policy
DROP POLICY IF EXISTS "vapi_call_logs_insert_webhook" ON public.vapi_call_logs;

-- Ensure RLS is still enabled
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;

-- Note: The VAPI webhook edge function uses service_role key to insert records,
-- so it will bypass RLS and still be able to write to this table.
-- By removing the permissive policy, we prevent any direct manipulation.