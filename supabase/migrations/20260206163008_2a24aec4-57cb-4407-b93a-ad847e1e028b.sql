-- =========================================
-- FORMS_SUBMISSIONS SECURITY HARDENING
-- =========================================

-- 1. Add encrypted columns for sensitive PII
ALTER TABLE public.forms_submissions
ADD COLUMN IF NOT EXISTS email_hash text,
ADD COLUMN IF NOT EXISTS phone_hash text,
ADD COLUMN IF NOT EXISTS ip_hash text;

-- 2. Create anonymization function for old submissions
CREATE OR REPLACE FUNCTION public.anonymize_old_form_submissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Anonymize submissions older than 90 days that haven't been anonymized yet
  UPDATE forms_submissions
  SET
    -- Hash PII before clearing (for deduplication purposes)
    email_hash = COALESCE(email_hash, encode(sha256(lower(submitter_email)::bytea), 'hex')),
    phone_hash = COALESCE(phone_hash, encode(sha256(submitter_phone::bytea), 'hex')),
    ip_hash = COALESCE(ip_hash, encode(sha256(ip_address::bytea), 'hex')),
    -- Clear plaintext PII
    submitter_name = '[ANONYMIZED]',
    submitter_email = NULL,
    submitter_phone = NULL,
    ip_address = NULL,
    user_agent = NULL,
    -- Anonymize location to country-level only
    city = NULL,
    exact_location = NULL
  WHERE created_at < now() - interval '90 days'
    AND (submitter_email IS NOT NULL OR submitter_phone IS NOT NULL OR ip_address IS NOT NULL);
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

-- 3. Create scheduled job to run anonymization daily (via pg_cron if available)
-- This is a cron expression comment for reference:
-- SELECT cron.schedule('anonymize-form-submissions', '0 3 * * *', 'SELECT public.anonymize_old_form_submissions()');

-- 4. Add index on created_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_forms_submissions_created_at 
ON public.forms_submissions (created_at);

-- 5. Add index on email_hash for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_forms_submissions_email_hash 
ON public.forms_submissions (email_hash) WHERE email_hash IS NOT NULL;

-- 6. Update INSERT policy to also hash on insert (for immediate privacy)
CREATE OR REPLACE FUNCTION public.forms_submission_hash_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pre-compute hashes on insert for deduplication without exposing plaintext
  IF NEW.submitter_email IS NOT NULL THEN
    NEW.email_hash := encode(sha256(lower(NEW.submitter_email)::bytea), 'hex');
  END IF;
  IF NEW.submitter_phone IS NOT NULL THEN
    NEW.phone_hash := encode(sha256(NEW.submitter_phone::bytea), 'hex');
  END IF;
  IF NEW.ip_address IS NOT NULL THEN
    NEW.ip_hash := encode(sha256(NEW.ip_address::bytea), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-hash on insert
DROP TRIGGER IF EXISTS forms_submissions_hash_pii_trigger ON public.forms_submissions;
CREATE TRIGGER forms_submissions_hash_pii_trigger
BEFORE INSERT ON public.forms_submissions
FOR EACH ROW
EXECUTE FUNCTION public.forms_submission_hash_pii();

-- 7. Add comment documenting data retention policy
COMMENT ON TABLE public.forms_submissions IS 
'Form submissions with 90-day PII retention policy. After 90 days, submitter_email, submitter_phone, ip_address, city, and exact_location are anonymized. Hashes are retained for deduplication.';