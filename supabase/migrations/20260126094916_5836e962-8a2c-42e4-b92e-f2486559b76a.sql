-- =====================================================
-- SECURITY FIX: VAPI Call Logs PII Protection
-- Encrypt sensitive fields, add retention, restrict access
-- =====================================================

-- 1. Add encrypted columns for sensitive PII
ALTER TABLE vapi_call_logs 
  ADD COLUMN IF NOT EXISTS extracted_name_encrypted bytea,
  ADD COLUMN IF NOT EXISTS extracted_phone_encrypted bytea,
  ADD COLUMN IF NOT EXISTS extracted_email_encrypted bytea,
  ADD COLUMN IF NOT EXISTS transcript_encrypted bytea,
  ADD COLUMN IF NOT EXISTS retention_expires_at timestamptz DEFAULT (now() + interval '90 days');

-- 2. Create function to redact sensitive patterns from transcripts
CREATE OR REPLACE FUNCTION public.redact_sensitive_transcript(p_transcript text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  redacted text;
BEGIN
  IF p_transcript IS NULL THEN
    RETURN NULL;
  END IF;
  
  redacted := p_transcript;
  
  -- Redact credit card patterns (16 digits with optional spaces/dashes)
  redacted := regexp_replace(redacted, '\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b', '[REDACTED-CC]', 'g');
  
  -- Redact CVV patterns (3-4 digits after "cvv" or "cvc")
  redacted := regexp_replace(redacted, '(?i)(cvv|cvc|security code)[:\s]*\d{3,4}', '\1: [REDACTED]', 'g');
  
  -- Redact SSN patterns
  redacted := regexp_replace(redacted, '\b\d{3}[\s\-]?\d{2}[\s\-]?\d{4}\b', '[REDACTED-SSN]', 'g');
  
  -- Redact password mentions
  redacted := regexp_replace(redacted, '(?i)(password|passcode|pin)[:\s]+[^\s,\.]+', '\1: [REDACTED]', 'g');
  
  -- Redact bank account patterns (8-17 digits)
  redacted := regexp_replace(redacted, '\b(?:account[:\s]*)?(?:number[:\s]*)?\d{8,17}\b', '[REDACTED-ACCOUNT]', 'gi');
  
  RETURN redacted;
END;
$$;

-- 3. Create encryption trigger for vapi_call_logs
CREATE OR REPLACE FUNCTION public.encrypt_vapi_call_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  -- Use fallback key if not set
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-vapi-calls-encryption-key-2024';
  END IF;

  -- Encrypt and mask extracted_name
  IF NEW.extracted_name IS NOT NULL AND NEW.extracted_name != '' AND NEW.extracted_name NOT LIKE '%[encrypted]%' THEN
    NEW.extracted_name_encrypted := pgp_sym_encrypt(NEW.extracted_name, encryption_key);
    NEW.extracted_name := left(NEW.extracted_name, 1) || '*** [encrypted]';
  END IF;

  -- Encrypt and mask extracted_phone  
  IF NEW.extracted_phone IS NOT NULL AND NEW.extracted_phone != '' AND NEW.extracted_phone NOT LIKE '***%' THEN
    NEW.extracted_phone_encrypted := pgp_sym_encrypt(NEW.extracted_phone, encryption_key);
    NEW.extracted_phone := '***' || right(NEW.extracted_phone, 4);
  END IF;

  -- Encrypt and mask extracted_email
  IF NEW.extracted_email IS NOT NULL AND NEW.extracted_email != '' AND NEW.extracted_email NOT LIKE 'redacted-%@%' THEN
    NEW.extracted_email_encrypted := pgp_sym_encrypt(NEW.extracted_email, encryption_key);
    NEW.extracted_email := 'redacted-' || right(NEW.id::text, 8) || '@' || split_part(NEW.extracted_email, '@', 2);
  END IF;

  -- Redact and encrypt transcript
  IF NEW.transcript IS NOT NULL AND NEW.transcript != '' THEN
    -- First encrypt the original
    IF NEW.transcript_encrypted IS NULL THEN
      NEW.transcript_encrypted := pgp_sym_encrypt(NEW.transcript, encryption_key);
    END IF;
    -- Then redact sensitive patterns from visible transcript
    NEW.transcript := redact_sensitive_transcript(NEW.transcript);
  END IF;

  -- Set retention expiry (90 days by default)
  IF NEW.retention_expires_at IS NULL THEN
    NEW.retention_expires_at := now() + interval '90 days';
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS trigger_encrypt_vapi_call_pii ON vapi_call_logs;
CREATE TRIGGER trigger_encrypt_vapi_call_pii
  BEFORE INSERT OR UPDATE ON vapi_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_vapi_call_pii();

-- 5. Create secure decryption function for authorized personnel ONLY
CREATE OR REPLACE FUNCTION public.decrypt_vapi_call_pii(p_call_id uuid)
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
      WHEN v.extracted_name_encrypted IS NOT NULL THEN pgp_sym_decrypt(v.extracted_name_encrypted, encryption_key)
      ELSE v.extracted_name
    END,
    CASE 
      WHEN v.extracted_phone_encrypted IS NOT NULL THEN pgp_sym_decrypt(v.extracted_phone_encrypted, encryption_key)
      ELSE v.extracted_phone
    END,
    CASE 
      WHEN v.extracted_email_encrypted IS NOT NULL THEN pgp_sym_decrypt(v.extracted_email_encrypted, encryption_key)
      ELSE v.extracted_email
    END,
    CASE 
      WHEN v.transcript_encrypted IS NOT NULL THEN pgp_sym_decrypt(v.transcript_encrypted, encryption_key)
      ELSE v.transcript
    END,
    v.recording_url,
    v.created_at
  FROM vapi_call_logs v
  WHERE v.id = p_call_id;
END;
$$;

-- 6. Drop existing overly permissive policies
DROP POLICY IF EXISTS vapi_call_logs_select_strict ON vapi_call_logs;
DROP POLICY IF EXISTS vapi_call_logs_service_role ON vapi_call_logs;

-- 7. Create stricter SELECT policy (owner/founder only, or lead owner)
CREATE POLICY vapi_call_logs_select_executive ON vapi_call_logs
  FOR SELECT
  TO authenticated
  USING (
    -- Only owner, founder, or owner_admin can see call logs
    has_role(auth.uid(), 'owner'::app_role) OR
    EXISTS (
      SELECT 1 FROM crm_users_profile cup
      WHERE cup.user_id = auth.uid() 
        AND cup.is_active = true 
        AND cup.crm_role IN ('owner_admin', 'founder')
    ) OR
    -- Lead owner can see calls related to their leads
    EXISTS (
      SELECT 1 FROM crm_leads cl
      WHERE cl.id = vapi_call_logs.lead_id 
        AND cl.owner_user_id = auth.uid()
    )
  );

-- 8. Service role policy for edge functions (without USING true for write)
CREATE POLICY vapi_call_logs_service_select ON vapi_call_logs
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY vapi_call_logs_service_insert ON vapi_call_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY vapi_call_logs_service_update ON vapi_call_logs
  FOR UPDATE
  TO service_role
  USING (true);

-- 9. Add restrictive base policy
DROP POLICY IF EXISTS vapi_call_logs_default_deny ON vapi_call_logs;
CREATE POLICY vapi_call_logs_default_deny ON vapi_call_logs
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

-- 10. Create retention cleanup function (can be scheduled via pg_cron or edge function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_vapi_recordings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  -- Null out recording URLs for expired records (keep metadata for audit)
  UPDATE vapi_call_logs
  SET 
    recording_url = NULL,
    transcript = '[EXPIRED - Data retention policy]',
    transcript_encrypted = NULL
  WHERE retention_expires_at < now()
    AND recording_url IS NOT NULL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- 11. Add comment for documentation
COMMENT ON TABLE vapi_call_logs IS 'Call recordings with encrypted PII. Transcripts auto-redact sensitive patterns. 90-day retention on recordings. Use decrypt_vapi_call_pii() for authorized access.';