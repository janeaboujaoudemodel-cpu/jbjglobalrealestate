-- Secure employee_salaries table: auto-encrypt banking data and mask plaintext on insert/update

-- Create the encryption trigger function
CREATE OR REPLACE FUNCTION public.encrypt_employee_salary_banking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'PII_ENCRYPTION_KEY'
  LIMIT 1;

  -- If no vault key, use a fallback (should be configured in production)
  IF encryption_key IS NULL THEN
    encryption_key := 'jbj-secure-salary-vault-2024';
  END IF;

  -- Encrypt bank account number if provided
  IF NEW.bank_account_number IS NOT NULL AND NEW.bank_account_number != '' AND NEW.bank_account_number NOT LIKE '****%' THEN
    NEW.bank_account_encrypted := pgp_sym_encrypt(NEW.bank_account_number, encryption_key);
    -- Mask plaintext field
    NEW.bank_account_number := '****' || RIGHT(NEW.bank_account_number, 4);
  END IF;

  -- Encrypt IBAN if provided
  IF NEW.bank_iban IS NOT NULL AND NEW.bank_iban != '' AND NEW.bank_iban NOT LIKE '%****%' THEN
    NEW.bank_iban_encrypted := pgp_sym_encrypt(NEW.bank_iban, encryption_key);
    -- Mask plaintext field (show first 4 and last 4 chars)
    NEW.bank_iban := LEFT(NEW.bank_iban, 4) || '****' || RIGHT(NEW.bank_iban, 4);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS encrypt_salary_banking_insert ON public.employee_salaries;
CREATE TRIGGER encrypt_salary_banking_insert
  BEFORE INSERT ON public.employee_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_employee_salary_banking();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS encrypt_salary_banking_update ON public.employee_salaries;
CREATE TRIGGER encrypt_salary_banking_update
  BEFORE UPDATE ON public.employee_salaries
  FOR EACH ROW
  WHEN (
    (OLD.bank_account_number IS DISTINCT FROM NEW.bank_account_number AND NEW.bank_account_number NOT LIKE '****%')
    OR (OLD.bank_iban IS DISTINCT FROM NEW.bank_iban AND NEW.bank_iban NOT LIKE '%****%')
  )
  EXECUTE FUNCTION public.encrypt_employee_salary_banking();

-- Create secure decryption function with audit logging
CREATE OR REPLACE FUNCTION public.decrypt_employee_salary_banking(salary_id UUID)
RETURNS TABLE(
  bank_account_number TEXT,
  bank_iban TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
  v_user_id UUID;
  v_user_role TEXT;
  v_salary_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user role
  SELECT user_role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  
  -- Get salary record owner
  SELECT es.user_id INTO v_salary_user_id FROM public.employee_salaries es WHERE es.id = salary_id;
  
  -- Check authorization: owner, admin, or record owner only
  IF v_user_role NOT IN ('owner', 'owner_admin', 'founder', 'finance_admin') 
     AND v_user_id != v_salary_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to salary banking data';
  END IF;

  -- Log access attempt
  INSERT INTO public.audit_logs (
    action_type,
    resource_type,
    resource_id,
    user_id,
    user_email,
    description,
    details,
    ip_address
  ) VALUES (
    'view',
    'employee_salary',
    salary_id,
    v_user_id,
    (SELECT email FROM public.profiles WHERE id = v_user_id),
    'Decrypted employee salary banking data',
    jsonb_build_object('salary_id', salary_id, 'accessor_role', v_user_role),
    '0.0.0.0'::inet
  );

  -- Get encryption key
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'PII_ENCRYPTION_KEY'
  LIMIT 1;

  IF encryption_key IS NULL THEN
    encryption_key := 'jbj-secure-salary-vault-2024';
  END IF;

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    CASE WHEN es.bank_account_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(es.bank_account_encrypted, encryption_key)
      ELSE es.bank_account_number
    END,
    CASE WHEN es.bank_iban_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(es.bank_iban_encrypted, encryption_key)
      ELSE es.bank_iban
    END
  FROM public.employee_salaries es
  WHERE es.id = salary_id;
END;
$$;

-- Grant execute to authenticated users (function enforces authorization internally)
GRANT EXECUTE ON FUNCTION public.decrypt_employee_salary_banking(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.encrypt_employee_salary_banking() IS 'Auto-encrypts banking data and masks plaintext fields on insert/update';
COMMENT ON FUNCTION public.decrypt_employee_salary_banking(UUID) IS 'Decrypts banking data with role-based authorization and audit logging';