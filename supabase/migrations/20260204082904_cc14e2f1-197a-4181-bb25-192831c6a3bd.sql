
-- Drop the existing function with old signature
DROP FUNCTION IF EXISTS public.get_vapi_call_decrypted_pii(uuid);

-- Recreate with updated signature including recording_url
CREATE OR REPLACE FUNCTION public.get_vapi_call_decrypted_pii(p_call_id uuid)
RETURNS TABLE(
  id uuid,
  extracted_name text,
  extracted_phone text,
  extracted_email text,
  transcript text,
  recording_url text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := 'jbj-vapi-calls-encryption-key-2024';
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
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    auth.email(),
    'read'::audit_action_type,
    'call_log'::audit_resource_type,
    p_call_id::text,
    'Decrypted VAPI call PII accessed',
    jsonb_build_object(
      'access_type', 'decrypt_pii',
      'timestamp', now()
    ),
    '0.0.0.0'::inet
  );
  
  -- Update access tracking on the record
  UPDATE public.vapi_call_logs
  SET 
    access_count = COALESCE(access_count, 0) + 1,
    last_accessed_at = now(),
    last_accessed_by = auth.uid()
  WHERE vapi_call_logs.id = p_call_id;
  
  -- Return decrypted data
  RETURN QUERY
  SELECT 
    v.id,
    CASE 
      WHEN v.extracted_name_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(v.extracted_name_encrypted, encryption_key)
      ELSE NULL
    END,
    CASE 
      WHEN v.extracted_phone_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(v.extracted_phone_encrypted, encryption_key)
      ELSE NULL
    END,
    CASE 
      WHEN v.extracted_email_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(v.extracted_email_encrypted, encryption_key)
      ELSE NULL
    END,
    CASE 
      WHEN v.transcript_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(v.transcript_encrypted, encryption_key)
      ELSE NULL
    END,
    CASE 
      WHEN v.recording_url_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(v.recording_url_encrypted, encryption_key)
      ELSE NULL
    END,
    v.created_at
  FROM vapi_call_logs v
  WHERE v.id = p_call_id;
END;
$$;

-- Add comment explaining the security model
COMMENT ON TABLE public.vapi_call_logs IS 
'VAPI call logs with zero-plaintext security model. 
All PII (name, phone, email, transcript, recording_url) stored in encrypted columns only.
Access restricted to owner/founder roles via RLS.
Decryption via get_vapi_call_decrypted_pii() RPC with full audit logging.
All mutations logged to audit_logs table.
30-day retention policy with automatic cleanup.';

-- Grant execute on the decryption function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_vapi_call_decrypted_pii(uuid) TO authenticated;
