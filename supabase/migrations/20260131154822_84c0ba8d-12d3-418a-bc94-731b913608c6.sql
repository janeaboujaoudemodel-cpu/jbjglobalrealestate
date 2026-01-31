-- Add encrypted columns for sensitive PII in hr_employees
ALTER TABLE public.hr_employees 
ADD COLUMN IF NOT EXISTS email_encrypted bytea,
ADD COLUMN IF NOT EXISTS phone_encrypted bytea,
ADD COLUMN IF NOT EXISTS cv_url_encrypted bytea;

-- Create encryption function for hr_employees PII
CREATE OR REPLACE FUNCTION public.encrypt_hr_employee_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
  unique_suffix text;
BEGIN
  -- Generate encryption key from employee ID
  encryption_key := digest(NEW.id::text || 'hr_employee_pii_v1_secure', 'sha256');
  unique_suffix := right(NEW.id::text, 8);

  -- Encrypt email if provided and not already masked
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email NOT LIKE 'redacted-%@%' THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encode(encryption_key, 'base64'));
    -- Mask the plaintext email (keep first 2 chars and domain)
    NEW.email := 'redacted-' || unique_suffix || '@' || split_part(NEW.email, '@', 2);
  END IF;

  -- Encrypt phone if provided and not already masked
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone NOT LIKE '***%' THEN
    NEW.phone_encrypted := pgp_sym_encrypt(NEW.phone, encode(encryption_key, 'base64'));
    -- Mask the plaintext phone (keep last 4 digits)
    NEW.phone := '***' || right(NEW.phone, 4);
  END IF;

  -- Encrypt CV URL if provided and not already masked
  IF NEW.cv_url IS NOT NULL AND NEW.cv_url != '' AND NEW.cv_url NOT LIKE '[PROTECTED]%' THEN
    NEW.cv_url_encrypted := pgp_sym_encrypt(NEW.cv_url, encode(encryption_key, 'base64'));
    -- Mask the plaintext CV URL
    NEW.cv_url := '[PROTECTED-CV-' || unique_suffix || ']';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to encrypt PII on insert/update
DROP TRIGGER IF EXISTS encrypt_hr_employee_pii_trigger ON public.hr_employees;
CREATE TRIGGER encrypt_hr_employee_pii_trigger
  BEFORE INSERT OR UPDATE ON public.hr_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_hr_employee_pii();

-- Create decryption function (only for authorized users)
CREATE OR REPLACE FUNCTION public.decrypt_hr_employee_pii(p_employee_id uuid)
RETURNS TABLE(email text, phone text, cv_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
  v_record RECORD;
BEGIN
  -- Verify caller has HR admin access
  IF NOT (
    public.is_hr_admin_strict(auth.uid()) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    -- Check if user is viewing their own record
    IF NOT EXISTS (
      SELECT 1 FROM public.hr_employees 
      WHERE id = p_employee_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only HR admins or the employee themselves can decrypt PII';
    END IF;
  END IF;
  
  -- Generate decryption key
  encryption_key := digest(p_employee_id::text || 'hr_employee_pii_v1_secure', 'sha256');
  
  -- Log the decryption access
  INSERT INTO public.hr_access_logs (user_id, resource_type, access_type, records_accessed, metadata)
  VALUES (auth.uid(), 'hr_employee_pii', 'decrypt', 1, jsonb_build_object('employee_id', p_employee_id));
  
  -- Get and decrypt the record
  SELECT 
    CASE WHEN e.email_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(e.email_encrypted, encode(encryption_key, 'base64'))
      ELSE e.email 
    END,
    CASE WHEN e.phone_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(e.phone_encrypted, encode(encryption_key, 'base64'))
      ELSE e.phone 
    END,
    CASE WHEN e.cv_url_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(e.cv_url_encrypted, encode(encryption_key, 'base64'))
      ELSE e.cv_url 
    END
  INTO v_record
  FROM public.hr_employees e
  WHERE e.id = p_employee_id;
  
  RETURN QUERY SELECT v_record.email, v_record.phone, v_record.cv_url;
END;
$$;

-- Create secure view with masked data for general access
CREATE OR REPLACE VIEW public.hr_employees_secure
WITH (security_invoker = on)
AS
SELECT 
  id,
  candidate_id,
  user_id,
  -- Mask full name to initials for non-authorized users
  CASE 
    WHEN user_id = auth.uid() OR is_hr_admin_strict(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role)
    THEN full_name
    ELSE left(full_name, 1) || '***'
  END as full_name,
  email, -- Already masked by trigger
  phone, -- Already masked by trigger  
  position,
  department,
  start_date,
  employee_status,
  cv_url, -- Already masked by trigger
  skills,
  certifications,
  created_at,
  updated_at,
  created_by
FROM public.hr_employees;

-- Add comment for documentation
COMMENT ON FUNCTION public.decrypt_hr_employee_pii(uuid) IS 
  'Decrypts employee PII (email, phone, cv_url). Access restricted to HR admins, owners, or the employee themselves. All access is logged.';

COMMENT ON VIEW public.hr_employees_secure IS 
  'Secure view of hr_employees with masked PII. Use decrypt_hr_employee_pii() function to get full details when authorized.';