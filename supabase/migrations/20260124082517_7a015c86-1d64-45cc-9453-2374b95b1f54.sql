-- Fix Security Definer View warning
-- Recreate the view with explicit SECURITY INVOKER (uses caller's permissions)

DROP VIEW IF EXISTS public.employee_salaries_secure;

CREATE VIEW public.employee_salaries_secure 
WITH (security_invoker = true)
AS
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

-- Re-grant access to the secure view
GRANT SELECT ON public.employee_salaries_secure TO authenticated;

-- Update the comment
COMMENT ON VIEW public.employee_salaries_secure IS 'Secure view of employee salaries with masked bank account numbers and IBANs. Uses SECURITY INVOKER to respect RLS policies of the querying user.';