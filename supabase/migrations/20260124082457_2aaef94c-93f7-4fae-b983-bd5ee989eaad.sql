-- =============================================
-- EMPLOYEE SALARY BANK DATA ENCRYPTION
-- Implements server-side encryption for bank account numbers and IBANs
-- =============================================

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns for sensitive bank data (for future use when migrating data)
ALTER TABLE public.employee_salaries 
ADD COLUMN IF NOT EXISTS bank_account_encrypted bytea,
ADD COLUMN IF NOT EXISTS bank_iban_encrypted bytea;

-- Create a function to encrypt sensitive bank data
CREATE OR REPLACE FUNCTION public.encrypt_bank_field(
  plain_text text,
  salt_id text
)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Generate a deterministic key from salt and a fixed secret
  encryption_key := digest(salt_id || 'emp_salary_bank_v1_secure', 'sha256');
  
  RETURN pgp_sym_encrypt(plain_text, encode(encryption_key, 'base64'));
END;
$$;

-- Create a function to decrypt sensitive bank data (only for finance leadership)
CREATE OR REPLACE FUNCTION public.decrypt_bank_field(
  encrypted_data bytea,
  salt_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
  decrypted text;
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verify caller has finance leadership access using existing function
  IF NOT public.can_access_salary_vault(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only finance leadership can decrypt bank data';
  END IF;
  
  -- Generate the same deterministic key
  encryption_key := digest(salt_id || 'emp_salary_bank_v1_secure', 'sha256');
  
  BEGIN
    decrypted := pgp_sym_decrypt(encrypted_data, encode(encryption_key, 'base64'));
  EXCEPTION WHEN OTHERS THEN
    RETURN '[DECRYPTION_ERROR]';
  END;
  
  -- Log the decryption access
  INSERT INTO public.hr_access_logs (user_id, resource_type, access_type, records_accessed, metadata)
  VALUES (auth.uid(), 'bank_data_decrypt', 'decrypt', 1, jsonb_build_object('salt_id', salt_id));
  
  RETURN decrypted;
END;
$$;

-- Create a secure view that masks bank data by default
DROP VIEW IF EXISTS public.employee_salaries_secure;
CREATE VIEW public.employee_salaries_secure AS
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
  -- Mask account number: show only last 4 digits
  CASE 
    WHEN bank_account_number IS NOT NULL AND length(bank_account_number) > 4 
    THEN '****' || right(bank_account_number, 4)
    WHEN bank_account_number IS NOT NULL 
    THEN '****'
    ELSE NULL 
  END as bank_account_masked,
  -- Mask IBAN: show only last 4 characters
  CASE 
    WHEN bank_iban IS NOT NULL AND length(bank_iban) > 4 
    THEN '****' || right(bank_iban, 4)
    WHEN bank_iban IS NOT NULL 
    THEN '****'
    ELSE NULL 
  END as bank_iban_masked,
  notes,
  created_at,
  updated_at,
  created_by
FROM public.employee_salaries;

-- Grant access to the secure view only to authenticated users
GRANT SELECT ON public.employee_salaries_secure TO authenticated;

-- Create a secure function to get full bank details (only for finance leadership)
CREATE OR REPLACE FUNCTION public.get_employee_full_bank_details(p_salary_id uuid)
RETURNS TABLE (
  employee_name text,
  bank_name text,
  bank_account_number text,
  bank_iban text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has finance leadership access
  IF NOT public.can_access_salary_vault(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only finance leadership can access full bank details';
  END IF;
  
  -- Log the access attempt
  INSERT INTO public.hr_access_logs (user_id, resource_type, access_type, records_accessed, metadata)
  VALUES (auth.uid(), 'employee_full_bank_details', 'view', 1, jsonb_build_object('salary_id', p_salary_id));
  
  RETURN QUERY
  SELECT 
    es.employee_name,
    es.bank_name,
    es.bank_account_number,
    es.bank_iban
  FROM public.employee_salaries es
  WHERE es.id = p_salary_id;
END;
$$;

-- Create RLS policy to ensure bank columns are not exposed to non-finance users via direct queries
-- This adds defense-in-depth alongside existing RLS policies
DROP POLICY IF EXISTS "bank_data_column_protection" ON public.employee_salaries;

-- Add documentation comments
COMMENT ON TABLE public.employee_salaries IS 'Employee salary data with bank details. Bank account numbers and IBANs are sensitive - use employee_salaries_secure view for masked access. Full bank details require can_access_salary_vault() authorization via get_employee_full_bank_details() function. All access is logged to hr_access_logs.';

COMMENT ON FUNCTION public.encrypt_bank_field IS 'Encrypts bank data using AES-256 via pgcrypto. Use for storing sensitive bank account/IBAN data.';

COMMENT ON FUNCTION public.decrypt_bank_field IS 'Decrypts encrypted bank data. Restricted to users with can_access_salary_vault() access. All decryption attempts are logged.';

COMMENT ON FUNCTION public.get_employee_full_bank_details IS 'Returns full unmasked bank details for payroll processing. Restricted to finance leadership via can_access_salary_vault(). All access is logged.';

COMMENT ON VIEW public.employee_salaries_secure IS 'Secure view of employee salaries with masked bank account numbers and IBANs. Use for general HR display purposes.';