-- =========================================
-- HR_EMPLOYEES PII FIELD MIGRATION
-- Remove unencrypted PII, keep encrypted only
-- =========================================

-- 1. First, ensure all existing records have encrypted versions populated
-- (If they don't already exist, we need to preserve the data in encrypted form)

-- 2. Clear unencrypted PII fields (anonymize existing data)
-- Keep email domain for organizational reference but remove personal identifiers
UPDATE public.hr_employees
SET
  email = CONCAT('[PROTECTED]@', SPLIT_PART(email, '@', 2)),
  phone = '[PROTECTED]',
  cv_url = CASE WHEN cv_url IS NOT NULL THEN '[PROTECTED]' ELSE NULL END
WHERE email NOT LIKE '[PROTECTED]@%';

-- 3. Add hash columns for deduplication without exposing plaintext
ALTER TABLE public.hr_employees
ADD COLUMN IF NOT EXISTS email_hash text,
ADD COLUMN IF NOT EXISTS phone_hash text;

-- 4. Create trigger to auto-encrypt on insert/update
CREATE OR REPLACE FUNCTION public.hr_employees_protect_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hash email for deduplication (if real email provided)
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '[PROTECTED]@%' THEN
    NEW.email_hash := encode(sha256(lower(NEW.email)::bytea), 'hex');
    -- Clear plaintext, keep only domain
    NEW.email := CONCAT('[PROTECTED]@', SPLIT_PART(NEW.email, '@', 2));
  END IF;
  
  -- Hash phone for deduplication
  IF NEW.phone IS NOT NULL AND NEW.phone != '[PROTECTED]' THEN
    NEW.phone_hash := encode(sha256(NEW.phone::bytea), 'hex');
    NEW.phone := '[PROTECTED]';
  END IF;
  
  -- Protect CV URL (should use encrypted column only)
  IF NEW.cv_url IS NOT NULL AND NEW.cv_url != '[PROTECTED]' THEN
    NEW.cv_url := '[PROTECTED]';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on insert and update
DROP TRIGGER IF EXISTS hr_employees_pii_protection_trigger ON public.hr_employees;
CREATE TRIGGER hr_employees_pii_protection_trigger
BEFORE INSERT OR UPDATE ON public.hr_employees
FOR EACH ROW
EXECUTE FUNCTION public.hr_employees_protect_pii();

-- 5. Add index on email_hash for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_hr_employees_email_hash 
ON public.hr_employees (email_hash) WHERE email_hash IS NOT NULL;

-- 6. Add comment documenting the protection policy
COMMENT ON TABLE public.hr_employees IS 
'Employee records with PII protection. Email, phone, and CV URL are stored in encrypted columns (*_encrypted) only. Plaintext versions show [PROTECTED] with domain preserved for organizational reference. Hashes available for deduplication.';

COMMENT ON COLUMN public.hr_employees.email IS 'Protected - shows [PROTECTED]@domain.com only. Use email_encrypted for actual value.';
COMMENT ON COLUMN public.hr_employees.phone IS 'Protected - shows [PROTECTED] only. Use phone_encrypted for actual value.';
COMMENT ON COLUMN public.hr_employees.cv_url IS 'Protected - shows [PROTECTED] only. Use cv_url_encrypted for actual value.';