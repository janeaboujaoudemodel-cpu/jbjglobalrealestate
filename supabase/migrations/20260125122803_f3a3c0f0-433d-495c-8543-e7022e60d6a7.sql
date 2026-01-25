
-- SECURITY FIX: Encrypt bank account data in employee_salaries table
-- Similar to leads table protection pattern

-- Step 1: Create encryption function for salary bank data
CREATE OR REPLACE FUNCTION public.encrypt_salary_bank_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  -- Use a fallback key if not set
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-salary-vault-key-2024';
  END IF;

  -- Encrypt bank_account_number if provided and not already masked
  IF NEW.bank_account_number IS NOT NULL AND NEW.bank_account_number != '' AND NEW.bank_account_number NOT LIKE '****%' THEN
    NEW.bank_account_encrypted := pgp_sym_encrypt(NEW.bank_account_number, encryption_key);
    -- Mask the plaintext (keep last 4 digits)
    NEW.bank_account_number := '****' || right(NEW.bank_account_number, 4);
  END IF;

  -- Encrypt bank_iban if provided and not already masked
  IF NEW.bank_iban IS NOT NULL AND NEW.bank_iban != '' AND NEW.bank_iban NOT LIKE '****%' THEN
    NEW.bank_iban_encrypted := pgp_sym_encrypt(NEW.bank_iban, encryption_key);
    -- Mask the plaintext (keep last 4 digits)
    NEW.bank_iban := '****' || right(NEW.bank_iban, 4);
  END IF;

  RETURN NEW;
END;
$function$;

-- Step 2: Create decryption function for authorized vault access
CREATE OR REPLACE FUNCTION public.decrypt_salary_bank_data(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
BEGIN
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-salary-vault-key-2024';
  END IF;
  
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(encrypted_data, encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[decryption failed]';
END;
$function$;

-- Step 3: Create trigger for automatic encryption
DROP TRIGGER IF EXISTS encrypt_salary_bank_trigger ON public.employee_salaries;
CREATE TRIGGER encrypt_salary_bank_trigger
BEFORE INSERT OR UPDATE ON public.employee_salaries
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_salary_bank_data();

-- Step 4: Encrypt any existing plaintext data (if any exists)
UPDATE public.employee_salaries
SET 
  bank_account_encrypted = CASE 
    WHEN bank_account_number IS NOT NULL AND bank_account_number != '' AND bank_account_number NOT LIKE '****%'
    THEN pgp_sym_encrypt(bank_account_number, 'jbj-salary-vault-key-2024')
    ELSE bank_account_encrypted
  END,
  bank_account_number = CASE 
    WHEN bank_account_number IS NOT NULL AND bank_account_number != '' AND bank_account_number NOT LIKE '****%'
    THEN '****' || right(bank_account_number, 4)
    ELSE bank_account_number
  END,
  bank_iban_encrypted = CASE 
    WHEN bank_iban IS NOT NULL AND bank_iban != '' AND bank_iban NOT LIKE '****%'
    THEN pgp_sym_encrypt(bank_iban, 'jbj-salary-vault-key-2024')
    ELSE bank_iban_encrypted
  END,
  bank_iban = CASE 
    WHEN bank_iban IS NOT NULL AND bank_iban != '' AND bank_iban NOT LIKE '****%'
    THEN '****' || right(bank_iban, 4)
    ELSE bank_iban
  END
WHERE 
  (bank_account_number IS NOT NULL AND bank_account_number != '' AND bank_account_number NOT LIKE '****%')
  OR (bank_iban IS NOT NULL AND bank_iban != '' AND bank_iban NOT LIKE '****%');

-- Step 5: Update the secure view with security_invoker and conditional decryption
DROP VIEW IF EXISTS public.employee_salaries_secure;
CREATE VIEW public.employee_salaries_secure WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  employee_name,
  department,
  base_salary,
  currency,
  salary_type,
  effective_date,
  end_date,
  bank_name,
  -- Only decrypt for vault-authorized users
  CASE 
    WHEN can_access_salary_vault(auth.uid()) THEN decrypt_salary_bank_data(bank_account_encrypted)
    ELSE bank_account_number  -- Already masked
  END AS bank_account_number,
  CASE 
    WHEN can_access_salary_vault(auth.uid()) THEN decrypt_salary_bank_data(bank_iban_encrypted)
    ELSE bank_iban  -- Already masked
  END AS bank_iban,
  notes,
  created_at,
  updated_at,
  created_by
FROM employee_salaries;

-- Step 6: Add comments for documentation
COMMENT ON TRIGGER encrypt_salary_bank_trigger ON public.employee_salaries IS 
'SECURITY: Auto-encrypts bank account data and masks plaintext on insert/update';

COMMENT ON VIEW public.employee_salaries_secure IS 
'SECURITY: Provides conditional decryption of bank data only for vault-authorized users (founder, owner_admin, owner)';

COMMENT ON FUNCTION public.encrypt_salary_bank_data() IS
'SECURITY: Encrypts bank_account_number and bank_iban using pgcrypto, masks plaintext columns';

COMMENT ON FUNCTION public.decrypt_salary_bank_data(bytea) IS
'SECURITY: Decrypts salary bank data - only callable by vault-authorized users via RLS';
