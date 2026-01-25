
-- SECURITY FIX: Attach encryption trigger and encrypt existing PII data
-- Uses unique ID in redacted format to avoid email uniqueness conflicts

-- Step 1: Update the encrypt_lead_pii function to use unique redaction format
CREATE OR REPLACE FUNCTION public.encrypt_lead_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
  unique_suffix text;
BEGIN
  -- Use a fallback key if not set (for development)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-leads-encryption-key-2024';
  END IF;
  
  -- Create unique suffix from record ID (last 8 chars)
  unique_suffix := right(NEW.id::text, 8);

  -- Encrypt email if provided and not already masked
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email NOT LIKE 'redacted-%@%' THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encryption_key);
    -- Mask with unique identifier to maintain uniqueness constraint
    NEW.email := 'redacted-' || unique_suffix || '@' || split_part(NEW.email, '@', 2);
  END IF;

  -- Encrypt phone if provided and not already masked
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone NOT LIKE '***%' THEN
    NEW.phone_encrypted := pgp_sym_encrypt(NEW.phone, encryption_key);
    -- Mask the plaintext phone (keep last 4 digits)
    NEW.phone := '***' || right(NEW.phone, 4);
  END IF;

  -- Encrypt full_name if provided and not already masked
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND NEW.full_name NOT LIKE '% [encrypted]' THEN
    NEW.full_name_encrypted := pgp_sym_encrypt(NEW.full_name, encryption_key);
    -- Keep first initial + masked
    NEW.full_name := left(NEW.full_name, 1) || '*** [encrypted]';
  END IF;

  RETURN NEW;
END;
$function$;

-- Step 2: Create trigger to encrypt PII on INSERT and UPDATE
DROP TRIGGER IF EXISTS encrypt_leads_pii_trigger ON public.leads;
CREATE TRIGGER encrypt_leads_pii_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_lead_pii();

-- Step 3: Encrypt and redact all existing plaintext data in a single UPDATE
UPDATE public.leads
SET 
  -- Encrypt email
  email_encrypted = CASE 
    WHEN email IS NOT NULL AND email != '' AND email NOT LIKE 'redacted-%@%'
    THEN pgp_sym_encrypt(email, 'jbj-leads-encryption-key-2024')
    ELSE email_encrypted
  END,
  -- Redact email with unique ID suffix
  email = CASE 
    WHEN email IS NOT NULL AND email != '' AND email NOT LIKE 'redacted-%@%'
    THEN 'redacted-' || right(id::text, 8) || '@' || split_part(email, '@', 2)
    ELSE email
  END,
  
  -- Encrypt phone
  phone_encrypted = CASE 
    WHEN phone IS NOT NULL AND phone != '' AND phone NOT LIKE '***%'
    THEN pgp_sym_encrypt(phone, 'jbj-leads-encryption-key-2024')
    ELSE phone_encrypted
  END,
  -- Redact phone
  phone = CASE 
    WHEN phone IS NOT NULL AND phone != '' AND phone NOT LIKE '***%'
    THEN '***' || right(phone, 4)
    ELSE phone
  END,
  
  -- Encrypt full_name
  full_name_encrypted = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND full_name NOT LIKE '% [encrypted]' AND full_name NOT LIKE '% (encrypted)'
    THEN pgp_sym_encrypt(full_name, 'jbj-leads-encryption-key-2024')
    ELSE full_name_encrypted
  END,
  -- Redact full_name
  full_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND full_name NOT LIKE '% [encrypted]' AND full_name NOT LIKE '% (encrypted)'
    THEN left(full_name, 1) || '*** [encrypted]'
    ELSE full_name
  END
WHERE 
  (email IS NOT NULL AND email != '' AND email NOT LIKE 'redacted-%@%')
  OR (phone IS NOT NULL AND phone != '' AND phone NOT LIKE '***%')
  OR (full_name IS NOT NULL AND full_name != '' AND full_name NOT LIKE '% [encrypted]' AND full_name NOT LIKE '% (encrypted)');

-- Step 4: Update the leads_secure view to handle the new redaction format
CREATE OR REPLACE VIEW public.leads_secure WITH (security_invoker = on) AS
SELECT 
  id,
  CASE 
    WHEN is_authorized_staff() THEN decrypt_lead_pii(email_encrypted)
    ELSE email
  END AS email,
  CASE 
    WHEN is_authorized_staff() THEN decrypt_lead_pii(phone_encrypted)
    ELSE phone
  END AS phone,
  CASE 
    WHEN is_authorized_staff() THEN decrypt_lead_pii(full_name_encrypted)
    ELSE full_name
  END AS full_name,
  nationality,
  language,
  source,
  created_at,
  updated_at,
  current_location,
  age_range,
  consent_accurate,
  consent_privacy,
  page_source,
  status,
  birthday,
  phone_verified,
  email_verified
FROM leads;

COMMENT ON TRIGGER encrypt_leads_pii_trigger ON public.leads IS 
'SECURITY: Auto-encrypts PII (email, phone, full_name) and redacts plaintext on insert/update';

COMMENT ON VIEW public.leads_secure IS 
'SECURITY: Provides conditional decryption of lead PII for authorized staff only';
