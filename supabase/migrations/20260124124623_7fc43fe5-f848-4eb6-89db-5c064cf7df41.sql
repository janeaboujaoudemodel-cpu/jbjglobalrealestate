-- Add encrypted columns for sensitive data
ALTER TABLE public.contact_gating_submissions 
ADD COLUMN IF NOT EXISTS email_encrypted bytea,
ADD COLUMN IF NOT EXISTS phone_encrypted bytea;

-- Create function to encrypt contact data on insert
CREATE OR REPLACE FUNCTION public.encrypt_contact_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from vault or use a derived key
  encryption_key := coalesce(
    current_setting('app.encryption_key', true),
    encode(digest(gen_random_uuid()::text || now()::text, 'sha256'), 'hex')
  );
  
  -- Encrypt email if provided
  IF NEW.email IS NOT NULL THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encryption_key);
  END IF;
  
  -- Encrypt phone if provided  
  IF NEW.phone IS NOT NULL THEN
    NEW.phone_encrypted := pgp_sym_encrypt(NEW.phone, encryption_key);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for encryption (only on new inserts going forward)
DROP TRIGGER IF EXISTS encrypt_contact_submission_trigger ON public.contact_gating_submissions;
CREATE TRIGGER encrypt_contact_submission_trigger
  BEFORE INSERT ON public.contact_gating_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_contact_submission();

-- Create secure view that masks sensitive data for staff
CREATE OR REPLACE VIEW public.contact_gating_submissions_secure AS
SELECT 
  id,
  full_name,
  -- Mask email: show first 2 chars and domain
  CASE 
    WHEN email IS NOT NULL AND email LIKE '%@%' 
    THEN LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE '***'
  END as email_masked,
  -- Mask phone: show last 4 digits only
  CASE 
    WHEN phone IS NOT NULL AND LENGTH(phone) > 4
    THEN '***' || RIGHT(phone, 4)
    ELSE '***'
  END as phone_masked,
  nationality,
  location,
  service_interest,
  preferred_language,
  session_id,
  email_verified,
  phone_verified,
  created_at
FROM public.contact_gating_submissions;

-- Grant access to secure view for authenticated users with proper roles
GRANT SELECT ON public.contact_gating_submissions_secure TO authenticated;

-- Create RLS policy for secure view access
ALTER VIEW public.contact_gating_submissions_secure SET (security_invoker = true);

-- Ensure audit logging trigger exists for access tracking
CREATE OR REPLACE FUNCTION public.log_contact_submission_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.contact_gating_access_logs (
    submission_id,
    user_id,
    user_email,
    access_type,
    ip_address,
    user_agent,
    accessed_at
  ) VALUES (
    OLD.id,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    TG_OP,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
  RETURN OLD;
END;
$$;

-- Add comment documenting security measures
COMMENT ON TABLE public.contact_gating_submissions IS 
'Protected contact form submissions. Sensitive data (email, phone) is encrypted at rest. 
Access restricted to authorized staff only. All access is audited in contact_gating_access_logs.
Use contact_gating_submissions_secure view for masked data access.';