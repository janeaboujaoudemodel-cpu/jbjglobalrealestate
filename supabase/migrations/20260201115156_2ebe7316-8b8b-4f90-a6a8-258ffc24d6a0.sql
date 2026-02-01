-- Add encrypted column for full_name if not exists
ALTER TABLE public.contact_gating_submissions 
ADD COLUMN IF NOT EXISTS full_name_encrypted bytea;

-- Create trigger function to encrypt PII and mask plaintext on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_contact_gating_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;
  
  -- Use fallback if no key found
  IF encryption_key IS NULL THEN
    encryption_key := current_setting('app.settings.pii_key', true);
    IF encryption_key IS NULL OR encryption_key = '' THEN
      encryption_key := 'jbj-pii-encryption-key-2024';
    END IF;
  END IF;
  
  -- Encrypt full_name
  IF NEW.full_name IS NOT NULL AND NEW.full_name NOT LIKE 'Protected-%' THEN
    NEW.full_name_encrypted := pgp_sym_encrypt(NEW.full_name, encryption_key);
    -- Mask plaintext: show only initials
    NEW.full_name := 'Protected-' || 
      CASE 
        WHEN position(' ' in NEW.full_name) > 0 THEN
          substring(NEW.full_name from 1 for 1) || '.' || 
          substring(NEW.full_name from position(' ' in NEW.full_name) + 1 for 1) || '.'
        ELSE
          substring(NEW.full_name from 1 for 1) || '.'
      END;
  END IF;
  
  -- Encrypt email
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE 'protected-%' THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encryption_key);
    -- Mask plaintext: show domain only
    NEW.email := 'protected-***@' || split_part(NEW.email, '@', 2);
  END IF;
  
  -- Encrypt phone
  IF NEW.phone IS NOT NULL AND NEW.phone NOT LIKE 'protected-%' THEN
    NEW.phone_encrypted := pgp_sym_encrypt(NEW.phone, encryption_key);
    -- Mask plaintext: show last 4 digits only
    NEW.phone := 'protected-****' || right(NEW.phone, 4);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for insert and update
DROP TRIGGER IF EXISTS encrypt_contact_gating_insert ON public.contact_gating_submissions;
CREATE TRIGGER encrypt_contact_gating_insert
  BEFORE INSERT ON public.contact_gating_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_contact_gating_pii();

DROP TRIGGER IF EXISTS encrypt_contact_gating_update ON public.contact_gating_submissions;
CREATE TRIGGER encrypt_contact_gating_update
  BEFORE UPDATE ON public.contact_gating_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_contact_gating_pii();

-- Create secure decryption function with audit logging
CREATE OR REPLACE FUNCTION public.decrypt_contact_gating_pii(submission_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  phone text,
  nationality text,
  location text,
  service_interest text,
  preferred_language text,
  email_verified boolean,
  phone_verified boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  user_role text;
  has_access boolean := false;
BEGIN
  -- Check if user has authorized role
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner', 'admin', 'listing_admin')
  ) INTO has_access;
  
  IF NOT has_access THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to decrypt contact submissions';
  END IF;
  
  -- Get encryption key
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    encryption_key := current_setting('app.settings.pii_key', true);
    IF encryption_key IS NULL OR encryption_key = '' THEN
      encryption_key := 'jbj-pii-encryption-key-2024';
    END IF;
  END IF;
  
  -- Log access attempt
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    ip_address
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()),
    'view',
    'contact_gating',
    submission_id::text,
    'Decrypted contact gating submission PII',
    '0.0.0.0'::inet
  );
  
  -- Return decrypted data
  RETURN QUERY
  SELECT 
    cgs.id,
    CASE 
      WHEN cgs.full_name_encrypted IS NOT NULL THEN pgp_sym_decrypt(cgs.full_name_encrypted, encryption_key)
      ELSE cgs.full_name
    END as full_name,
    CASE 
      WHEN cgs.email_encrypted IS NOT NULL THEN pgp_sym_decrypt(cgs.email_encrypted, encryption_key)
      ELSE cgs.email
    END as email,
    CASE 
      WHEN cgs.phone_encrypted IS NOT NULL THEN pgp_sym_decrypt(cgs.phone_encrypted, encryption_key)
      ELSE cgs.phone
    END as phone,
    cgs.nationality,
    cgs.location,
    cgs.service_interest,
    cgs.preferred_language,
    cgs.email_verified,
    cgs.phone_verified,
    cgs.created_at
  FROM contact_gating_submissions cgs
  WHERE cgs.id = submission_id;
END;
$$;

-- Update existing records to encrypt plaintext data
DO $$
DECLARE
  encryption_key text;
  rec RECORD;
BEGIN
  -- Get encryption key
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    encryption_key := 'jbj-pii-encryption-key-2024';
  END IF;
  
  -- Update records that have plaintext data
  FOR rec IN 
    SELECT id, full_name, email, phone 
    FROM contact_gating_submissions 
    WHERE (email NOT LIKE 'protected-%' OR full_name NOT LIKE 'Protected-%' OR phone NOT LIKE 'protected-%')
  LOOP
    UPDATE contact_gating_submissions
    SET 
      full_name_encrypted = CASE 
        WHEN rec.full_name NOT LIKE 'Protected-%' THEN pgp_sym_encrypt(rec.full_name, encryption_key)
        ELSE full_name_encrypted
      END,
      full_name = CASE 
        WHEN rec.full_name NOT LIKE 'Protected-%' THEN 
          'Protected-' || 
          CASE 
            WHEN position(' ' in rec.full_name) > 0 THEN
              substring(rec.full_name from 1 for 1) || '.' || 
              substring(rec.full_name from position(' ' in rec.full_name) + 1 for 1) || '.'
            ELSE
              substring(rec.full_name from 1 for 1) || '.'
          END
        ELSE full_name
      END,
      email_encrypted = CASE 
        WHEN rec.email NOT LIKE 'protected-%' THEN pgp_sym_encrypt(rec.email, encryption_key)
        ELSE email_encrypted
      END,
      email = CASE 
        WHEN rec.email NOT LIKE 'protected-%' THEN 'protected-***@' || split_part(rec.email, '@', 2)
        ELSE email
      END,
      phone_encrypted = CASE 
        WHEN rec.phone NOT LIKE 'protected-%' THEN pgp_sym_encrypt(rec.phone, encryption_key)
        ELSE phone_encrypted
      END,
      phone = CASE 
        WHEN rec.phone NOT LIKE 'protected-%' THEN 'protected-****' || right(rec.phone, 4)
        ELSE phone
      END
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Update the secure view to use security_invoker
DROP VIEW IF EXISTS public.contact_gating_submissions_secure;
CREATE VIEW public.contact_gating_submissions_secure
WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  email AS email_masked,
  phone AS phone_masked,
  nationality,
  location,
  service_interest,
  preferred_language,
  session_id,
  email_verified,
  phone_verified,
  created_at
FROM contact_gating_submissions;

-- Grant access to authenticated users
GRANT SELECT ON public.contact_gating_submissions_secure TO authenticated;