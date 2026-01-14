-- Remove any remaining public/anon access to sensitive tables
DROP POLICY IF EXISTS "vapi_public_insert_validated" ON public.vapi_call_logs;

-- Revoke direct table access from anon role
REVOKE ALL ON public.vapi_call_logs FROM anon;
REVOKE ALL ON public.ai_brokers FROM anon;