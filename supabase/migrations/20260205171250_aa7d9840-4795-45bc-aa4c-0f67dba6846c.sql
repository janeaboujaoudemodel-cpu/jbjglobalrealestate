-- Fix Security Definer View: employee_salaries_masked
-- Recreate with security_invoker = true to respect RLS of querying user

DROP VIEW IF EXISTS public.employee_salaries_masked;

CREATE VIEW public.employee_salaries_masked
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
    CASE
        WHEN bank_account_encrypted IS NOT NULL THEN '****' || right(encode(bank_account_encrypted, 'escape'), 4)
        ELSE NULL::text
    END AS bank_account_masked,
    CASE
        WHEN bank_iban_encrypted IS NOT NULL THEN '****' || right(encode(bank_iban_encrypted, 'escape'), 4)
        ELSE NULL::text
    END AS bank_iban_masked,
    notes,
    created_at,
    updated_at,
    created_by
FROM employee_salaries;

-- Grant appropriate permissions
GRANT SELECT ON public.employee_salaries_masked TO authenticated;