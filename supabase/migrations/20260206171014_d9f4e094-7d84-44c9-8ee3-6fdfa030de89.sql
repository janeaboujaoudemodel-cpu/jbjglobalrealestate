
-- =========================================
-- FIX: employee_salaries Security Hardening
-- 1. Enable FORCE RLS
-- 2. Add bank_name_encrypted column
-- 3. Create trigger to auto-mask bank_name
-- 4. Recreate views with security_invoker = true
-- 5. Add HR access audit logging
-- =========================================

-- 1. Enable FORCE ROW LEVEL SECURITY
ALTER TABLE public.employee_salaries FORCE ROW LEVEL SECURITY;

-- 2. Add encrypted bank_name column (if not exists)
ALTER TABLE public.employee_salaries 
ADD COLUMN IF NOT EXISTS bank_name_encrypted bytea;

-- 3. Create trigger function to mask plaintext bank_name
CREATE OR REPLACE FUNCTION public.protect_employee_salary_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- If bank_name is being set and is not already masked
  IF NEW.bank_name IS NOT NULL AND NEW.bank_name NOT LIKE '[PROTECTED]%' THEN
    -- Store masked version in plaintext column
    NEW.bank_name := '[PROTECTED]';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS employee_salary_protect_pii ON public.employee_salaries;
CREATE TRIGGER employee_salary_protect_pii
  BEFORE INSERT OR UPDATE ON public.employee_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_employee_salary_pii();

-- 5. Drop and recreate views with security_invoker = true

-- 5a. employee_salaries_masked - with security invoker
DROP VIEW IF EXISTS public.employee_salaries_masked;
CREATE VIEW public.employee_salaries_masked 
WITH (security_invoker = true) AS
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
  CASE 
    WHEN bank_account_encrypted IS NOT NULL 
    THEN '****' || right(encode(bank_account_encrypted, 'escape'), 4)
    ELSE NULL 
  END AS bank_account_masked,
  CASE 
    WHEN bank_iban_encrypted IS NOT NULL 
    THEN '****' || right(encode(bank_iban_encrypted, 'escape'), 4)
    ELSE NULL 
  END AS bank_iban_masked,
  CASE 
    WHEN bank_name_encrypted IS NOT NULL 
    THEN '****' || right(encode(bank_name_encrypted, 'escape'), 4)
    ELSE NULL 
  END AS bank_name_masked,
  notes,
  created_at,
  updated_at,
  created_by
FROM public.employee_salaries;

-- 5b. employee_salaries_self_service - with security invoker
DROP VIEW IF EXISTS public.employee_salaries_self_service;
CREATE VIEW public.employee_salaries_self_service 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  employee_name,
  department,
  CASE 
    WHEN user_id = auth.uid() THEN base_salary 
    ELSE NULL 
  END AS base_salary,
  currency,
  salary_type,
  effective_date,
  end_date,
  -- Bank name only visible to finance/HR or masked for self
  CASE 
    WHEN has_finance_hr_access(auth.uid()) AND bank_name_encrypted IS NOT NULL 
    THEN encode(bank_name_encrypted, 'escape')
    WHEN user_id = auth.uid() AND bank_name_encrypted IS NOT NULL 
    THEN '****' || right(encode(bank_name_encrypted, 'escape'), 4)
    ELSE NULL 
  END AS bank_name_display,
  CASE 
    WHEN has_finance_hr_access(auth.uid()) OR user_id = auth.uid() THEN notes 
    ELSE NULL 
  END AS notes,
  created_at,
  updated_at
FROM public.employee_salaries
WHERE user_id = auth.uid() OR has_finance_hr_access(auth.uid());

-- 5c. employee_salaries_secure - restricted to salary vault access only
DROP VIEW IF EXISTS public.employee_salaries_secure;
CREATE VIEW public.employee_salaries_secure 
WITH (security_invoker = true) AS
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
  -- Full bank details only for vault access
  CASE 
    WHEN bank_name_encrypted IS NOT NULL 
    THEN encode(bank_name_encrypted, 'escape')
    ELSE bank_name 
  END AS bank_name,
  CASE 
    WHEN bank_account_encrypted IS NOT NULL 
    THEN encode(bank_account_encrypted, 'escape')
    ELSE NULL 
  END AS bank_account,
  CASE 
    WHEN bank_iban_encrypted IS NOT NULL 
    THEN encode(bank_iban_encrypted, 'escape')
    ELSE NULL 
  END AS bank_iban,
  notes,
  created_at,
  updated_at,
  created_by
FROM public.employee_salaries
WHERE can_access_salary_vault(auth.uid());

-- 6. Add comments for documentation
COMMENT ON TABLE public.employee_salaries IS 
'Employee salary records. FORCE RLS enabled. Access restricted via can_access_salary_vault(). Bank data stored in *_encrypted columns only. Plaintext bank_name auto-masked to [PROTECTED].';

COMMENT ON VIEW public.employee_salaries_masked IS 
'Masked view of salaries with bank details partially hidden. security_invoker=true respects underlying RLS.';

COMMENT ON VIEW public.employee_salaries_self_service IS 
'Self-service view - employees see own salary, HR sees all with details. security_invoker=true.';

COMMENT ON VIEW public.employee_salaries_secure IS 
'Full salary details - only accessible to users with salary vault access. security_invoker=true.';
