-- Fix vapi_call_logs security: Restrict direct SELECT to owner/founder only
-- Other users must use the vapi_call_logs_masked view or get_vapi_call_decrypted_pii RPC

-- Drop the overly permissive SELECT policies
DROP POLICY IF EXISTS "vapi_call_logs_select_strict" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_strict_owner_access" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_default_deny" ON public.vapi_call_logs;

-- Create a single strict SELECT policy - only owner and founder roles
CREATE POLICY "vapi_call_logs_select_owner_founder_only"
ON public.vapi_call_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
      AND cup.is_active = true
      AND cup.crm_role = 'founder'::crm_role
  )
);

-- Add comment explaining the security model
COMMENT ON TABLE public.vapi_call_logs IS 'Sensitive call transcripts and recordings. Direct SELECT restricted to owner/founder. Other roles must use vapi_call_logs_masked view or get_vapi_call_decrypted_pii RPC with audit logging.';