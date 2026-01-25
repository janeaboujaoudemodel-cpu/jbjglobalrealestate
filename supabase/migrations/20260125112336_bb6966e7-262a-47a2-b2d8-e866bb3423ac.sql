-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns for sensitive PII
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_encrypted bytea,
ADD COLUMN IF NOT EXISTS phone_encrypted bytea,
ADD COLUMN IF NOT EXISTS full_name_encrypted bytea;

-- Create encryption function for leads PII
CREATE OR REPLACE FUNCTION public.encrypt_lead_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  -- Use a fallback key if not set (for development)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-leads-encryption-key-2024';
  END IF;

  -- Encrypt email if provided and not already masked
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email NOT LIKE 'redacted@%' THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encryption_key);
    -- Mask the plaintext email (keep domain for reference)
    NEW.email := 'redacted@' || split_part(NEW.email, '@', 2);
  END IF;

  -- Encrypt phone if provided and not already masked
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone NOT LIKE '***%' THEN
    NEW.phone_encrypted := pgp_sym_encrypt(NEW.phone, encryption_key);
    -- Mask the plaintext phone (keep last 4 digits)
    NEW.phone := '***' || right(NEW.phone, 4);
  END IF;

  -- Encrypt full_name if provided and not already masked
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND NEW.full_name NOT LIKE '% (encrypted)' THEN
    NEW.full_name_encrypted := pgp_sym_encrypt(NEW.full_name, encryption_key);
    -- Keep first initial + masked
    NEW.full_name := left(NEW.full_name, 1) || '*** (encrypted)';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for encryption on insert
DROP TRIGGER IF EXISTS encrypt_lead_on_insert ON public.leads;
CREATE TRIGGER encrypt_lead_on_insert
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_lead_pii();

-- Create trigger for encryption on update (only if PII columns change)
DROP TRIGGER IF EXISTS encrypt_lead_on_update ON public.leads;
CREATE TRIGGER encrypt_lead_on_update
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.full_name IS DISTINCT FROM NEW.full_name
  )
  EXECUTE FUNCTION public.encrypt_lead_pii();

-- Create decryption function for authorized staff
CREATE OR REPLACE FUNCTION public.decrypt_lead_pii(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-leads-encryption-key-2024';
  END IF;
  
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(encrypted_data, encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[decryption failed]';
END;
$$;

-- Create secure view for authorized staff with decrypted PII
DROP VIEW IF EXISTS public.leads_secure;
CREATE VIEW public.leads_secure
WITH (security_invoker = on)
AS
SELECT 
  id,
  -- Decrypt PII only for authorized staff
  CASE 
    WHEN public.is_authorized_staff() THEN public.decrypt_lead_pii(email_encrypted)
    ELSE email -- Shows masked version
  END as email,
  CASE 
    WHEN public.is_authorized_staff() THEN public.decrypt_lead_pii(phone_encrypted)
    ELSE phone -- Shows masked version
  END as phone,
  CASE 
    WHEN public.is_authorized_staff() THEN public.decrypt_lead_pii(full_name_encrypted)
    ELSE full_name -- Shows masked version
  END as full_name,
  -- Non-sensitive fields
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
FROM public.leads;

-- Grant access to secure view for authenticated users
GRANT SELECT ON public.leads_secure TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.leads_secure IS 'Secure view for leads with PII decryption for authorized staff only. Use this view instead of direct table access.';
COMMENT ON TABLE public.leads IS 'SECURITY: Contains encrypted PII. Access via leads_secure view. Direct table access shows masked data only.';