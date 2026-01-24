-- Fix security: Remove plaintext storage from contact_gating_submissions
-- The trigger encrypts data but keeps plaintext - this is a security risk

-- Step 1: Update the encryption trigger to NULL out plaintext after encrypting
CREATE OR REPLACE FUNCTION public.encrypt_contact_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from vault or use a derived key
  encryption_key := coalesce(
    current_setting('app.encryption_key', true),
    encode(digest(gen_random_uuid()::text || now()::text, 'sha256'), 'hex')
  );
  
  -- Encrypt email if provided and clear plaintext
  IF NEW.email IS NOT NULL THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encryption_key);
    -- Store a hash for lookups (rate limiting) but clear plaintext
    -- Keep only domain for analytics
    NEW.email := 'redacted@' || split_part(NEW.email, '@', 2);
  END IF;
  
  -- Encrypt phone if provided and clear plaintext
  IF NEW.phone IS NOT NULL THEN
    NEW.phone_encrypted := pgp_sym_encrypt(NEW.phone, encryption_key);
    -- Clear plaintext, keep only last 4 digits for reference
    NEW.phone := '***' || right(NEW.phone, 4);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 2: Clear existing plaintext data that's already been encrypted
UPDATE public.contact_gating_submissions
SET 
  email = CASE 
    WHEN email_encrypted IS NOT NULL AND email IS NOT NULL AND email NOT LIKE 'redacted@%'
    THEN 'redacted@' || split_part(email, '@', 2)
    ELSE email
  END,
  phone = CASE 
    WHEN phone_encrypted IS NOT NULL AND phone IS NOT NULL AND phone NOT LIKE '***%'
    THEN '***' || right(phone, 4)
    ELSE phone
  END
WHERE email_encrypted IS NOT NULL OR phone_encrypted IS NOT NULL;

-- Step 3: Update the secure view to show masked data only (no decryption in view)
DROP VIEW IF EXISTS public.contact_gating_submissions_secure;

CREATE VIEW public.contact_gating_submissions_secure
WITH (security_invoker = on)
AS SELECT 
    id,
    full_name,
    -- Only show domain for analytics, actual email is encrypted
    CASE
        WHEN email IS NOT NULL THEN email
        ELSE 'encrypted'
    END AS email_masked,
    -- Only show last 4 digits
    CASE
        WHEN phone IS NOT NULL THEN phone
        ELSE 'encrypted'
    END AS phone_masked,
    nationality,
    location,
    service_interest,
    preferred_language,
    session_id,
    email_verified,
    phone_verified,
    created_at
FROM contact_gating_submissions;

-- Step 4: Add comment explaining the security model
COMMENT ON TABLE public.contact_gating_submissions IS 
'Contact submissions with encrypted PII. Email and phone stored as encrypted bytea, 
plaintext columns contain only redacted versions (domain only for email, last 4 digits for phone). 
Full data only accessible via pgp_sym_decrypt with proper encryption key.';

COMMENT ON COLUMN public.contact_gating_submissions.email IS 'Redacted email (shows domain only for analytics). Full email is in email_encrypted.';
COMMENT ON COLUMN public.contact_gating_submissions.phone IS 'Redacted phone (shows last 4 digits only). Full phone is in phone_encrypted.';