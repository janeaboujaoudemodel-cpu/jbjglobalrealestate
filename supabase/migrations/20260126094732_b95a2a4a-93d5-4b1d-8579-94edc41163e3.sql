-- =====================================================
-- SECURITY FIX: Leads Table PII Protection
-- Attach encryption trigger and strengthen RLS
-- =====================================================

-- 1. Create or replace the encryption trigger function (ensure it exists)
CREATE OR REPLACE FUNCTION public.encrypt_lead_pii()
RETURNS trigger
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
    encryption_key := 'jbj-leads-encryption-key-2024';
  END IF;
  
  -- Create unique suffix from record ID (last 8 chars)
  unique_suffix := right(NEW.id::text, 8);

  -- Encrypt email if provided and not already masked
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email NOT LIKE 'redacted-%@%' THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encryption_key);
    -- Mask with unique identifier to maintain uniqueness
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
$$;

-- 2. Attach the trigger to leads table (drop if exists first)
DROP TRIGGER IF EXISTS trigger_encrypt_lead_pii ON leads;
CREATE TRIGGER trigger_encrypt_lead_pii
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_lead_pii();

-- 3. Create secure decryption function for authorized personnel ONLY
CREATE OR REPLACE FUNCTION public.decrypt_lead_pii(p_lead_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  phone text,
  full_name text,
  source text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  -- STRICT ACCESS CHECK: Only admin, owner, or CRM admin can decrypt
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'owner'::app_role) OR
    is_crm_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: Only authorized personnel can decrypt lead PII';
  END IF;
  
  -- Use fallback key if not set
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-leads-encryption-key-2024';
  END IF;
  
  -- Log the access
  INSERT INTO audit_logs (
    user_id, user_email, action_type, resource_type, resource_id, 
    description, ip_address
  ) VALUES (
    auth.uid(),
    auth.email(),
    'view'::audit_action_type,
    'lead'::audit_resource_type,
    p_lead_id::text,
    'Decrypted lead PII data',
    '0.0.0.0'::inet
  );
  
  RETURN QUERY
  SELECT 
    l.id,
    CASE 
      WHEN l.email_encrypted IS NOT NULL THEN pgp_sym_decrypt(l.email_encrypted, encryption_key)
      ELSE l.email
    END as email,
    CASE 
      WHEN l.phone_encrypted IS NOT NULL THEN pgp_sym_decrypt(l.phone_encrypted, encryption_key)
      ELSE l.phone
    END as phone,
    CASE 
      WHEN l.full_name_encrypted IS NOT NULL THEN pgp_sym_decrypt(l.full_name_encrypted, encryption_key)
      ELSE l.full_name
    END as full_name,
    l.source,
    l.created_at
  FROM leads l
  WHERE l.id = p_lead_id;
END;
$$;

-- 4. Add a default deny policy for any edge cases not covered
-- First drop existing policies that might conflict
DROP POLICY IF EXISTS leads_default_deny ON leads;

-- Create explicit deny for unauthenticated access
CREATE POLICY leads_default_deny ON leads
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (
    -- Only allow if user is authenticated
    auth.uid() IS NOT NULL
  );

-- 5. Add comment to table for documentation
COMMENT ON TABLE leads IS 'Customer lead data with encrypted PII. Plaintext fields contain masked values only. Use decrypt_lead_pii() function for authorized access to original data.';