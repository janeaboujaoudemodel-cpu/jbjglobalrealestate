
-- Drop the existing function first (return type changed)
DROP FUNCTION IF EXISTS public.get_vapi_call_decrypted_pii(uuid);

-- Create the updated secure RPC function with audit logging
CREATE OR REPLACE FUNCTION public.get_vapi_call_decrypted_pii(p_call_id uuid)
RETURNS TABLE(
  extracted_name text,
  extracted_phone text,
  extracted_email text,
  caller_name text,
  caller_phone text,
  transcript text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- STRICT: Only owner or founder can decrypt PII
  IF NOT (
    has_role(auth.uid(), 'owner'::app_role)
    OR EXISTS (
      SELECT 1 FROM crm_users_profile cup
      WHERE cup.user_id = auth.uid()
      AND cup.is_active = true
      AND cup.crm_role = 'founder'::crm_role
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only owner/founder can access decrypted call data';
  END IF;
  
  -- Log the access in audit_logs
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    ip_address
  ) VALUES (
    auth.uid(),
    auth.email(),
    'view'::audit_action_type,
    'call_log'::audit_resource_type,
    p_call_id::text,
    'Decrypted VAPI call PII accessed',
    '0.0.0.0'::inet
  );
  
  -- Update access tracking on the record
  UPDATE public.vapi_call_logs
  SET 
    access_count = COALESCE(access_count, 0) + 1,
    last_accessed_at = now(),
    last_accessed_by = auth.uid()
  WHERE id = p_call_id;
  
  -- Return the decrypted data
  RETURN QUERY
  SELECT 
    vcl.extracted_name,
    vcl.extracted_phone,
    vcl.extracted_email,
    vcl.caller_name,
    vcl.caller_phone,
    vcl.transcript
  FROM public.vapi_call_logs vcl
  WHERE vcl.id = p_call_id;
END;
$$;

-- Revoke direct function execution from public
REVOKE ALL ON FUNCTION public.get_vapi_call_decrypted_pii(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_vapi_call_decrypted_pii(uuid) TO authenticated;
