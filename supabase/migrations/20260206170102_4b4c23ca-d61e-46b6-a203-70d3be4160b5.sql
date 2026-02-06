
-- =========================================
-- FIX: contact_gating_submissions PII Protection
-- Enforce encrypted-only storage at DB level
-- =========================================

-- 1. Add email_hash column for de-duplication lookups (if not exists)
ALTER TABLE public.contact_gating_submissions 
ADD COLUMN IF NOT EXISTS email_hash text;

-- 2. Create index on email_hash for efficient lookups
CREATE INDEX IF NOT EXISTS idx_contact_gating_email_hash 
ON public.contact_gating_submissions(email_hash);

-- 3. Create trigger function to enforce PII masking
-- This ensures plaintext columns ALWAYS contain masked values
CREATE OR REPLACE FUNCTION public.protect_contact_gating_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- Hash email for lookups if not already provided
  IF NEW.email_hash IS NULL AND NEW.email IS NOT NULL AND NEW.email != '[ENCRYPTED]' THEN
    NEW.email_hash := encode(sha256(lower(trim(NEW.email))::bytea), 'hex');
  END IF;
  
  -- Force plaintext columns to masked values
  -- Actual data must be stored in encrypted columns only
  IF NEW.email IS NOT NULL AND NEW.email != '[ENCRYPTED]' THEN
    NEW.email := '[ENCRYPTED]';
  END IF;
  
  IF NEW.phone IS NOT NULL AND NEW.phone != '[ENCRYPTED]' THEN
    NEW.phone := '[ENCRYPTED]';
  END IF;
  
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '[ENCRYPTED]' THEN
    NEW.full_name := '[ENCRYPTED]';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Attach trigger to table
DROP TRIGGER IF EXISTS contact_gating_protect_pii ON public.contact_gating_submissions;
CREATE TRIGGER contact_gating_protect_pii
  BEFORE INSERT OR UPDATE ON public.contact_gating_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_contact_gating_pii();

-- 5. Enable FORCE RLS (service role respects policies)
ALTER TABLE public.contact_gating_submissions FORCE ROW LEVEL SECURITY;

-- 6. Add documentation
COMMENT ON TABLE public.contact_gating_submissions IS 
'Contact gating form submissions. PII stored ONLY in encrypted columns (email_encrypted, phone_encrypted, full_name_encrypted). Plaintext columns auto-masked to [ENCRYPTED] via trigger. email_hash used for deduplication. FORCE RLS enabled.';

COMMENT ON FUNCTION public.protect_contact_gating_pii() IS
'Enforces PII protection: hashes email for lookups, masks plaintext columns to [ENCRYPTED]. Actual PII must be stored in *_encrypted columns only.';
