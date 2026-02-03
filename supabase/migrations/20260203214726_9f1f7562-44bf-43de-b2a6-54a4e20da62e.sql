-- ============================================================
-- FIX: Remove plaintext sensitive columns from vapi_call_logs
-- Step 1: Drop dependent objects first (triggers, views)
-- ============================================================

-- Drop the existing triggers that depend on plaintext columns
DROP TRIGGER IF EXISTS trg_vapi_encrypt_pii ON public.vapi_call_logs;
DROP TRIGGER IF EXISTS trg_vapi_encrypt_pii_update ON public.vapi_call_logs;
DROP TRIGGER IF EXISTS trg_vapi_encrypt_pii_insert ON public.vapi_call_logs;

-- Drop the existing masked view
DROP VIEW IF EXISTS public.vapi_call_logs_masked;

-- Drop the old trigger function
DROP FUNCTION IF EXISTS public.encrypt_vapi_call_pii() CASCADE;

-- Now safely drop plaintext sensitive columns
ALTER TABLE public.vapi_call_logs 
  DROP COLUMN IF EXISTS transcript,
  DROP COLUMN IF EXISTS extracted_name,
  DROP COLUMN IF EXISTS extracted_phone,
  DROP COLUMN IF EXISTS extracted_email;

-- Recreate the trigger function for retention policy only
-- (no plaintext columns to mask anymore - data is encrypted at application level)
CREATE OR REPLACE FUNCTION public.vapi_set_retention_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set retention expiry if not set (30-day retention policy)
  IF NEW.retention_expires_at IS NULL THEN
    NEW.retention_expires_at := now() + interval '30 days';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for retention policy
CREATE TRIGGER trg_vapi_set_retention
  BEFORE INSERT ON public.vapi_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.vapi_set_retention_expiry();

-- Update the decrypt RPC to only use encrypted columns
CREATE OR REPLACE FUNCTION public.get_vapi_call_decrypted_pii(p_call_id uuid)
RETURNS TABLE (
  extracted_name text,
  extracted_phone text,
  extracted_email text,
  caller_name text,
  caller_phone text,
  transcript text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
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
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-vapi-calls-encryption-key-2024';
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
  
  -- Return the decrypted data from encrypted columns ONLY
  RETURN QUERY
  SELECT 
    CASE 
      WHEN vcl.extracted_name_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.extracted_name_encrypted, encryption_key)
      ELSE NULL
    END,
    CASE 
      WHEN vcl.extracted_phone_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.extracted_phone_encrypted, encryption_key)
      ELSE NULL
    END,
    CASE 
      WHEN vcl.extracted_email_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.extracted_email_encrypted, encryption_key)
      ELSE NULL
    END,
    vcl.caller_name,
    vcl.caller_phone,
    CASE 
      WHEN vcl.transcript_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.transcript_encrypted, encryption_key)
      ELSE NULL
    END
  FROM public.vapi_call_logs vcl
  WHERE vcl.id = p_call_id;
END;
$$;

-- Update the other decrypt function as well
CREATE OR REPLACE FUNCTION public.decrypt_vapi_call_pii(p_call_id uuid)
RETURNS TABLE (
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
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  -- STRICT ACCESS CHECK: Only owner or founder can decrypt call recordings
  IF NOT (
    has_role(auth.uid(), 'owner'::app_role) OR 
    EXISTS (
      SELECT 1 FROM crm_users_profile 
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND crm_role IN ('owner_admin', 'founder')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Only executives can decrypt call recording data';
  END IF;
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-vapi-calls-encryption-key-2024';
  END IF;
  
  -- Log the access
  INSERT INTO audit_logs (
    user_id, user_email, action_type, resource_type, resource_id, 
    description, ip_address
  ) VALUES (
    auth.uid(),
    auth.email(),
    'view'::audit_action_type,
    'system'::audit_resource_type,
    p_call_id::text,
    'Decrypted VAPI call recording PII',
    '0.0.0.0'::inet
  );
  
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
    v.recording_url,
    v.created_at
  FROM vapi_call_logs v
  WHERE v.id = p_call_id;
END;
$$;

-- Recreate the masked view without plaintext column references
CREATE OR REPLACE VIEW public.vapi_call_logs_masked
WITH (security_invoker = true)
AS
SELECT 
  id,
  call_id,
  ('***' || RIGHT(COALESCE(caller_phone, ''), 4)) AS caller_phone_masked,
  CASE 
    WHEN caller_name IS NOT NULL THEN LEFT(caller_name, 1) || '***'
    ELSE NULL
  END AS caller_name_masked,
  duration_seconds,
  '***ENCRYPTED***'::text AS transcript_masked,
  summary,
  NULL::text AS recording_url,
  ai_score,
  ai_issues,
  ai_highlights,
  ai_sentiment,
  ai_lead_quality,
  ai_summary,
  ai_follow_up_recommended,
  ai_audited_at,
  '***ENCRYPTED***'::text AS extracted_name_masked,
  '***ENCRYPTED***'::text AS extracted_phone_masked,
  '***ENCRYPTED***'::text AS extracted_email_masked,
  extracted_interest,
  extracted_budget,
  lead_id,
  needs_review,
  is_flagged,
  flag_reason,
  reviewed_by,
  reviewed_at,
  notes,
  call_status,
  ended_reason,
  assistant_name,
  created_at,
  updated_at,
  retention_expires_at,
  access_count
FROM public.vapi_call_logs;

-- Grant SELECT on masked view to authenticated users
GRANT SELECT ON public.vapi_call_logs_masked TO authenticated;

-- Revoke direct access from anon
REVOKE ALL ON public.vapi_call_logs FROM anon;

-- Add comment documenting the security model
COMMENT ON TABLE public.vapi_call_logs IS 'VAPI call logs with encrypted PII only. Plaintext columns removed 2026-02-03. Access: owner/founder only via RLS. Decryption: via get_vapi_call_decrypted_pii() RPC with audit logging.';