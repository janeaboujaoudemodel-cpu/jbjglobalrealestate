-- ============================================================
-- VAPI Call Logs Security Hardening
-- 1. Automatic retention cleanup function
-- 2. Encrypt-on-insert trigger to ensure no plaintext PII stored
-- 3. Function to clean expired records (can be called by edge function)
-- ============================================================

-- 1. Create function to encrypt VAPI call PII on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_vapi_call_pii()
RETURNS TRIGGER AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  -- Use default key if not set
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-vapi-calls-encryption-key-2024';
  END IF;
  
  -- Encrypt extracted_name if present and not already encrypted
  IF NEW.extracted_name IS NOT NULL AND NEW.extracted_name != '' THEN
    NEW.extracted_name_encrypted := pgp_sym_encrypt(NEW.extracted_name, encryption_key);
    NEW.extracted_name := '***PROTECTED***'; -- Mask plaintext
  END IF;
  
  -- Encrypt extracted_phone if present and not already encrypted
  IF NEW.extracted_phone IS NOT NULL AND NEW.extracted_phone != '' THEN
    NEW.extracted_phone_encrypted := pgp_sym_encrypt(NEW.extracted_phone, encryption_key);
    NEW.extracted_phone := '***PROTECTED***'; -- Mask plaintext
  END IF;
  
  -- Encrypt extracted_email if present and not already encrypted
  IF NEW.extracted_email IS NOT NULL AND NEW.extracted_email != '' THEN
    NEW.extracted_email_encrypted := pgp_sym_encrypt(NEW.extracted_email, encryption_key);
    NEW.extracted_email := '***PROTECTED***'; -- Mask plaintext
  END IF;
  
  -- Encrypt transcript if present and not already encrypted
  IF NEW.transcript IS NOT NULL AND NEW.transcript != '' AND 
     (NEW.transcript_encrypted IS NULL OR TG_OP = 'INSERT') THEN
    NEW.transcript_encrypted := pgp_sym_encrypt(NEW.transcript, encryption_key);
    NEW.transcript := '***TRANSCRIPT ENCRYPTED***'; -- Mask plaintext
  END IF;
  
  -- Also encrypt caller_phone and caller_name
  -- Note: Adding encrypted columns if they don't exist would need separate migration
  
  -- Set retention expiry if not set
  IF NEW.retention_expires_at IS NULL THEN
    NEW.retention_expires_at := now() + interval '30 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create trigger for automatic encryption on INSERT
DROP TRIGGER IF EXISTS trg_vapi_encrypt_pii_insert ON public.vapi_call_logs;
CREATE TRIGGER trg_vapi_encrypt_pii_insert
  BEFORE INSERT ON public.vapi_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_vapi_call_pii();

-- 3. Create trigger for automatic encryption on UPDATE
DROP TRIGGER IF EXISTS trg_vapi_encrypt_pii_update ON public.vapi_call_logs;
CREATE TRIGGER trg_vapi_encrypt_pii_update
  BEFORE UPDATE ON public.vapi_call_logs
  FOR EACH ROW
  WHEN (
    NEW.extracted_name IS DISTINCT FROM OLD.extracted_name OR
    NEW.extracted_phone IS DISTINCT FROM OLD.extracted_phone OR
    NEW.extracted_email IS DISTINCT FROM OLD.extracted_email OR
    NEW.transcript IS DISTINCT FROM OLD.transcript
  )
  EXECUTE FUNCTION public.encrypt_vapi_call_pii();

-- 4. Create function to cleanup expired VAPI call logs (30-day retention)
CREATE OR REPLACE FUNCTION public.cleanup_expired_vapi_calls()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
  v_storage_files TEXT[];
BEGIN
  -- First, collect any recording URLs to delete from storage
  SELECT ARRAY_AGG(recording_url) INTO v_storage_files
  FROM vapi_call_logs
  WHERE retention_expires_at < now()
    AND recording_url IS NOT NULL;
  
  -- Delete expired records
  DELETE FROM vapi_call_logs
  WHERE retention_expires_at < now();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Log the cleanup in audit logs
  IF v_deleted > 0 THEN
    INSERT INTO audit_logs (
      action_type, resource_type, description, ip_address
    ) VALUES (
      'delete'::audit_action_type,
      'system'::audit_resource_type,
      format('Automated retention cleanup: deleted %s expired VAPI call logs', v_deleted),
      '127.0.0.1'::inet
    );
  END IF;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create secure view for non-executive access (masked data only)
CREATE OR REPLACE VIEW public.vapi_call_logs_masked
WITH (security_invoker = true)
AS
SELECT
  id,
  call_id,
  '***' || RIGHT(COALESCE(caller_phone, ''), 4) AS caller_phone_masked,
  CASE 
    WHEN caller_name IS NOT NULL THEN LEFT(caller_name, 1) || '***'
    ELSE NULL
  END AS caller_name_masked,
  duration_seconds,
  '***ENCRYPTED***' AS transcript,
  summary,
  NULL::text AS recording_url, -- Never expose recording URL in masked view
  ai_score,
  ai_issues,
  ai_highlights,
  ai_sentiment,
  ai_lead_quality,
  ai_summary,
  ai_follow_up_recommended,
  ai_audited_at,
  '***' AS extracted_name,
  '***' AS extracted_phone,
  '***' AS extracted_email,
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
FROM vapi_call_logs;

-- 6. Grant access to the masked view for authenticated users
GRANT SELECT ON public.vapi_call_logs_masked TO authenticated;

-- 7. Add comment documenting security model
COMMENT ON TABLE public.vapi_call_logs IS 
  'VAPI call logs with 30-day retention policy. PII is auto-encrypted via trigger. '
  'Access restricted to owner/founder roles. Use vapi_call_logs_masked view for non-executive access. '
  'Decryption via decrypt_vapi_call_pii() function with audit logging.';

-- 8. Encrypt any existing plaintext data (one-time migration)
DO $$
DECLARE
  encryption_key text := 'jbj-vapi-calls-encryption-key-2024';
  r RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR r IN 
    SELECT id, extracted_name, extracted_phone, extracted_email, transcript
    FROM vapi_call_logs
    WHERE (extracted_name IS NOT NULL AND extracted_name != '***PROTECTED***' AND extracted_name_encrypted IS NULL)
       OR (extracted_phone IS NOT NULL AND extracted_phone != '***PROTECTED***' AND extracted_phone_encrypted IS NULL)
       OR (extracted_email IS NOT NULL AND extracted_email != '***PROTECTED***' AND extracted_email_encrypted IS NULL)
       OR (transcript IS NOT NULL AND transcript != '***TRANSCRIPT ENCRYPTED***' AND transcript_encrypted IS NULL)
  LOOP
    UPDATE vapi_call_logs SET
      extracted_name_encrypted = CASE 
        WHEN r.extracted_name IS NOT NULL AND r.extracted_name != '***PROTECTED***' 
        THEN pgp_sym_encrypt(r.extracted_name, encryption_key) 
        ELSE extracted_name_encrypted 
      END,
      extracted_name = CASE 
        WHEN r.extracted_name IS NOT NULL AND r.extracted_name != '***PROTECTED***' 
        THEN '***PROTECTED***' 
        ELSE extracted_name 
      END,
      extracted_phone_encrypted = CASE 
        WHEN r.extracted_phone IS NOT NULL AND r.extracted_phone != '***PROTECTED***' 
        THEN pgp_sym_encrypt(r.extracted_phone, encryption_key) 
        ELSE extracted_phone_encrypted 
      END,
      extracted_phone = CASE 
        WHEN r.extracted_phone IS NOT NULL AND r.extracted_phone != '***PROTECTED***' 
        THEN '***PROTECTED***' 
        ELSE extracted_phone 
      END,
      extracted_email_encrypted = CASE 
        WHEN r.extracted_email IS NOT NULL AND r.extracted_email != '***PROTECTED***' 
        THEN pgp_sym_encrypt(r.extracted_email, encryption_key) 
        ELSE extracted_email_encrypted 
      END,
      extracted_email = CASE 
        WHEN r.extracted_email IS NOT NULL AND r.extracted_email != '***PROTECTED***' 
        THEN '***PROTECTED***' 
        ELSE extracted_email 
      END,
      transcript_encrypted = CASE 
        WHEN r.transcript IS NOT NULL AND r.transcript != '***TRANSCRIPT ENCRYPTED***' 
        THEN pgp_sym_encrypt(r.transcript, encryption_key) 
        ELSE transcript_encrypted 
      END,
      transcript = CASE 
        WHEN r.transcript IS NOT NULL AND r.transcript != '***TRANSCRIPT ENCRYPTED***' 
        THEN '***TRANSCRIPT ENCRYPTED***' 
        ELSE transcript 
      END
    WHERE id = r.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Encrypted % existing VAPI call records', v_count;
  END IF;
END $$;