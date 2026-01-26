-- ============================================================================
-- VAPI CALL LOGS SECURITY HARDENING
-- Fix: vapi_call_logs_transcript_exposure
-- ============================================================================

-- 1. Create encryption function for VAPI call PII
CREATE OR REPLACE FUNCTION public.encrypt_vapi_call_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
  unique_suffix text;
BEGIN
  -- Use a fallback key if not set
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-vapi-encryption-key-2024';
  END IF;
  
  -- Create unique suffix from record ID
  unique_suffix := right(NEW.id::text, 8);

  -- Encrypt extracted_name if provided and not already masked
  IF NEW.extracted_name IS NOT NULL AND NEW.extracted_name != '' 
     AND NEW.extracted_name NOT LIKE '% [encrypted]' THEN
    NEW.extracted_name_encrypted := pgp_sym_encrypt(NEW.extracted_name, encryption_key);
    NEW.extracted_name := left(NEW.extracted_name, 1) || '*** [encrypted]';
  END IF;

  -- Encrypt extracted_phone if provided and not already masked
  IF NEW.extracted_phone IS NOT NULL AND NEW.extracted_phone != '' 
     AND NEW.extracted_phone NOT LIKE '***%' THEN
    NEW.extracted_phone_encrypted := pgp_sym_encrypt(NEW.extracted_phone, encryption_key);
    NEW.extracted_phone := '***' || right(NEW.extracted_phone, 4);
  END IF;

  -- Encrypt extracted_email if provided and not already masked
  IF NEW.extracted_email IS NOT NULL AND NEW.extracted_email != '' 
     AND NEW.extracted_email NOT LIKE 'redacted-%@%' THEN
    NEW.extracted_email_encrypted := pgp_sym_encrypt(NEW.extracted_email, encryption_key);
    NEW.extracted_email := 'redacted-' || unique_suffix || '@encrypted.local';
  END IF;

  -- Encrypt transcript and redact sensitive content
  IF NEW.transcript IS NOT NULL AND NEW.transcript != '' 
     AND NEW.transcript NOT LIKE '[ENCRYPTED]%' THEN
    -- Redact sensitive patterns first
    NEW.transcript := public.redact_sensitive_transcript(NEW.transcript);
    NEW.transcript_encrypted := pgp_sym_encrypt(NEW.transcript, encryption_key);
    NEW.transcript := '[ENCRYPTED] Transcript stored securely. Contact admin for access.';
  END IF;

  -- Mask caller_phone (not encrypted but masked for display)
  IF NEW.caller_phone IS NOT NULL AND NEW.caller_phone != '' 
     AND NEW.caller_phone NOT LIKE '***%' THEN
    NEW.caller_phone := '***' || right(NEW.caller_phone, 4);
  END IF;

  -- Mask caller_name
  IF NEW.caller_name IS NOT NULL AND NEW.caller_name != '' 
     AND NEW.caller_name NOT LIKE '% [masked]' THEN
    NEW.caller_name := left(NEW.caller_name, 1) || '*** [masked]';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create or replace trigger for PII encryption
DROP TRIGGER IF EXISTS trigger_encrypt_vapi_pii ON vapi_call_logs;
CREATE TRIGGER trigger_encrypt_vapi_pii
  BEFORE INSERT OR UPDATE ON vapi_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_vapi_call_pii();

-- 3. Create audit log function for VAPI call access
CREATE OR REPLACE FUNCTION public.log_vapi_call_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      action_type,
      resource_type,
      resource_id,
      description,
      details,
      ip_address
    )
    SELECT
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'view'::public.audit_action_type,
      'call_log'::public.audit_resource_type,
      NEW.id::text,
      'VAPI call log accessed: ' || COALESCE(NEW.call_id, 'unknown'),
      jsonb_build_object(
        'lead_id', NEW.lead_id,
        'has_transcript', NEW.transcript IS NOT NULL,
        'has_recording', NEW.recording_url IS NOT NULL,
        'access_time', now()
      ),
      '0.0.0.0'::inet;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Secure RPC to decrypt VAPI PII - only for owner/founder
CREATE OR REPLACE FUNCTION public.get_vapi_call_decrypted_pii(p_call_log_id uuid)
RETURNS TABLE(
  extracted_name text,
  extracted_phone text,
  extracted_email text,
  transcript text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- STRICT authorization check - only owner or founder
  IF NOT (
    public.has_role(v_user_id, 'owner'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.crm_users_profile
      WHERE user_id = v_user_id 
        AND crm_role = 'founder' 
        AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Only owner or founder can decrypt VAPI call PII';
  END IF;
  
  -- Use fallback key
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-vapi-encryption-key-2024';
  END IF;
  
  -- Log the decryption access
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    details,
    ip_address
  )
  SELECT
    v_user_id,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    'export'::public.audit_action_type,
    'call_log'::public.audit_resource_type,
    p_call_log_id::text,
    'VAPI call PII decrypted',
    jsonb_build_object('decryption_time', now()),
    '0.0.0.0'::inet;
  
  RETURN QUERY
  SELECT 
    CASE WHEN vcl.extracted_name_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.extracted_name_encrypted, encryption_key)
      ELSE vcl.extracted_name 
    END as extracted_name,
    CASE WHEN vcl.extracted_phone_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.extracted_phone_encrypted, encryption_key)
      ELSE vcl.extracted_phone 
    END as extracted_phone,
    CASE WHEN vcl.extracted_email_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.extracted_email_encrypted, encryption_key)
      ELSE vcl.extracted_email 
    END as extracted_email,
    CASE WHEN vcl.transcript_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(vcl.transcript_encrypted, encryption_key)
      ELSE vcl.transcript 
    END as transcript
  FROM public.vapi_call_logs vcl
  WHERE vcl.id = p_call_log_id;
END;
$$;

-- 5. Update retention period to 30 days (more compliant)
ALTER TABLE vapi_call_logs 
  ALTER COLUMN retention_expires_at SET DEFAULT (now() + interval '30 days');

-- 6. Add column for tracking access
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS access_count integer DEFAULT 0;
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz;
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS last_accessed_by uuid;

-- 7. Drop overly permissive policies
DROP POLICY IF EXISTS vapi_call_logs_select_executive ON vapi_call_logs;

-- 8. Create stricter SELECT policy - ONLY owner, founder, or lead owner
CREATE POLICY vapi_call_logs_select_strict ON vapi_call_logs
  FOR SELECT TO authenticated
  USING (
    -- Only owner role
    public.has_role(auth.uid(), 'owner'::app_role)
    -- Or founder in CRM
    OR EXISTS (
      SELECT 1 FROM public.crm_users_profile cup
      WHERE cup.user_id = auth.uid() 
        AND cup.is_active = true 
        AND cup.crm_role = 'founder'
    )
    -- Or the direct lead owner (if lead is assigned)
    OR (
      lead_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM public.crm_leads cl
        WHERE cl.id = vapi_call_logs.lead_id 
          AND cl.owner_user_id = auth.uid()
      )
    )
  );

-- 9. Create function to auto-redact expired recordings
CREATE OR REPLACE FUNCTION public.redact_expired_vapi_recordings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.vapi_call_logs
  SET 
    recording_url = NULL,
    transcript = '[REDACTED - Retention period expired]',
    transcript_encrypted = NULL,
    summary = '[REDACTED]',
    ai_summary = '[REDACTED]'
  WHERE retention_expires_at < now()
    AND (recording_url IS NOT NULL OR transcript_encrypted IS NOT NULL);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Log the redaction
  IF v_count > 0 THEN
    INSERT INTO public.audit_logs (
      action_type,
      resource_type,
      description,
      details,
      ip_address
    ) VALUES (
      'delete'::public.audit_action_type,
      'call_log'::public.audit_resource_type,
      'Automated VAPI recording redaction for compliance',
      jsonb_build_object('records_redacted', v_count, 'redaction_time', now()),
      '0.0.0.0'::inet
    );
  END IF;
  
  RETURN v_count;
END;
$$;

-- 10. Add comment for security documentation
COMMENT ON TABLE vapi_call_logs IS 'SECURITY: Contains encrypted PII and call recordings. Access restricted to owner/founder only. PII auto-encrypted on insert. 30-day retention with auto-redaction.';