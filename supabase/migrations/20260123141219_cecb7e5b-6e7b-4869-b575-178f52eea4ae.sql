
-- ================================================
-- TIGHTEN EMPLOYEE SALARY DATA PROTECTION
-- Only Founder, Owner Admin, and Owner can access salary data
-- Employees can only view their own data
-- ================================================

-- Step 1: Create strict salary access function
CREATE OR REPLACE FUNCTION public.can_access_salary_vault(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow checking own privileges (prevent privilege escalation)
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- STRICTEST ACCESS: Only founder and owner_admin from CRM profile
  -- OR owner from user_roles can access salary vault
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('founder', 'owner_admin')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
END;
$$;

-- Step 2: Drop ALL existing policies on employee_salaries
DROP POLICY IF EXISTS "Employees can view their own salary" ON public.employee_salaries;
DROP POLICY IF EXISTS "HR and Finance can manage salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "HR and Finance only can view all" ON public.employee_salaries;
DROP POLICY IF EXISTS "employee_salaries_admin_select" ON public.employee_salaries;
DROP POLICY IF EXISTS "employee_salaries_own_select" ON public.employee_salaries;
DROP POLICY IF EXISTS "employee_salaries_secure_manage" ON public.employee_salaries;
DROP POLICY IF EXISTS "employee_salaries_secure_select" ON public.employee_salaries;
DROP POLICY IF EXISTS "Strict salary access - select" ON public.employee_salaries;
DROP POLICY IF EXISTS "Strict salary access - insert" ON public.employee_salaries;
DROP POLICY IF EXISTS "Strict salary access - update" ON public.employee_salaries;
DROP POLICY IF EXISTS "Strict salary access - delete" ON public.employee_salaries;

-- Step 3: Enable RLS on employee_salaries (ensure it's enabled)
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW strict policies on employee_salaries

-- Employees can view ONLY their own salary
CREATE POLICY "salary_own_view"
ON public.employee_salaries
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only Founder/Owner Admin can SELECT all salary data
CREATE POLICY "salary_vault_select"
ON public.employee_salaries
FOR SELECT
TO authenticated
USING (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can INSERT salary data
CREATE POLICY "salary_vault_insert"
ON public.employee_salaries
FOR INSERT
TO authenticated
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can UPDATE salary data
CREATE POLICY "salary_vault_update"
ON public.employee_salaries
FOR UPDATE
TO authenticated
USING (can_access_salary_vault(auth.uid()))
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Owner can DELETE salary data (extra strict)
CREATE POLICY "salary_vault_delete"
ON public.employee_salaries
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
  OR EXISTS (SELECT 1 FROM public.crm_users_profile WHERE user_id = auth.uid() AND crm_role = 'founder' AND is_active = true)
);

-- Step 5: Drop ALL existing policies on employee_commissions
DROP POLICY IF EXISTS "Employees can view their own commissions" ON public.employee_commissions;
DROP POLICY IF EXISTS "HR and Finance can manage commissions" ON public.employee_commissions;
DROP POLICY IF EXISTS "HR and Finance can view all commissions" ON public.employee_commissions;
DROP POLICY IF EXISTS "employee_commissions_admin_select" ON public.employee_commissions;
DROP POLICY IF EXISTS "employee_commissions_own_select" ON public.employee_commissions;
DROP POLICY IF EXISTS "employee_commissions_secure_manage" ON public.employee_commissions;
DROP POLICY IF EXISTS "employee_commissions_secure_select" ON public.employee_commissions;

-- Step 6: Enable RLS on employee_commissions
ALTER TABLE public.employee_commissions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create NEW strict policies on employee_commissions

-- Employees can view ONLY their own commissions
CREATE POLICY "commission_own_view"
ON public.employee_commissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only Founder/Owner Admin can SELECT all commission data
CREATE POLICY "commission_vault_select"
ON public.employee_commissions
FOR SELECT
TO authenticated
USING (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can INSERT commission data
CREATE POLICY "commission_vault_insert"
ON public.employee_commissions
FOR INSERT
TO authenticated
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can UPDATE commission data
CREATE POLICY "commission_vault_update"
ON public.employee_commissions
FOR UPDATE
TO authenticated
USING (can_access_salary_vault(auth.uid()))
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Owner/Founder can DELETE commission data
CREATE POLICY "commission_vault_delete"
ON public.employee_commissions
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
  OR EXISTS (SELECT 1 FROM public.crm_users_profile WHERE user_id = auth.uid() AND crm_role = 'founder' AND is_active = true)
);

-- Step 8: Drop ALL existing policies on employee_payment_history
DROP POLICY IF EXISTS "Employees can view their own payments" ON public.employee_payment_history;
DROP POLICY IF EXISTS "HR and Finance can manage payments" ON public.employee_payment_history;
DROP POLICY IF EXISTS "HR and Finance can view all payments" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - delete" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - insert" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - select" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - update" ON public.employee_payment_history;

-- Step 9: Enable RLS on employee_payment_history
ALTER TABLE public.employee_payment_history ENABLE ROW LEVEL SECURITY;

-- Step 10: Create NEW strict policies on employee_payment_history

-- Employees can view ONLY their own payment history
CREATE POLICY "payment_own_view"
ON public.employee_payment_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only Founder/Owner Admin can SELECT all payment data
CREATE POLICY "payment_vault_select"
ON public.employee_payment_history
FOR SELECT
TO authenticated
USING (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can INSERT payment data
CREATE POLICY "payment_vault_insert"
ON public.employee_payment_history
FOR INSERT
TO authenticated
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can UPDATE payment data
CREATE POLICY "payment_vault_update"
ON public.employee_payment_history
FOR UPDATE
TO authenticated
USING (can_access_salary_vault(auth.uid()))
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Owner/Founder can DELETE payment data
CREATE POLICY "payment_vault_delete"
ON public.employee_payment_history
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
  OR EXISTS (SELECT 1 FROM public.crm_users_profile WHERE user_id = auth.uid() AND crm_role = 'founder' AND is_active = true)
);

-- Step 11: Drop ALL existing policies on employee_earnings_summary
DROP POLICY IF EXISTS "Employees can view their own earnings summary" ON public.employee_earnings_summary;
DROP POLICY IF EXISTS "HR and Finance can manage earnings summaries" ON public.employee_earnings_summary;
DROP POLICY IF EXISTS "HR and Finance can view all earnings summaries" ON public.employee_earnings_summary;

-- Step 12: Enable RLS on employee_earnings_summary
ALTER TABLE public.employee_earnings_summary ENABLE ROW LEVEL SECURITY;

-- Step 13: Create NEW strict policies on employee_earnings_summary

-- Employees can view ONLY their own earnings summary
CREATE POLICY "earnings_own_view"
ON public.employee_earnings_summary
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only Founder/Owner Admin can SELECT all earnings data
CREATE POLICY "earnings_vault_select"
ON public.employee_earnings_summary
FOR SELECT
TO authenticated
USING (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can INSERT earnings data
CREATE POLICY "earnings_vault_insert"
ON public.employee_earnings_summary
FOR INSERT
TO authenticated
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Founder/Owner Admin can UPDATE earnings data
CREATE POLICY "earnings_vault_update"
ON public.employee_earnings_summary
FOR UPDATE
TO authenticated
USING (can_access_salary_vault(auth.uid()))
WITH CHECK (can_access_salary_vault(auth.uid()));

-- Only Owner/Founder can DELETE earnings data
CREATE POLICY "earnings_vault_delete"
ON public.employee_earnings_summary
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
  OR EXISTS (SELECT 1 FROM public.crm_users_profile WHERE user_id = auth.uid() AND crm_role = 'founder' AND is_active = true)
);

-- Step 14: Update can_access_salary_data to be even stricter (founder only + owner)
CREATE OR REPLACE FUNCTION public.can_access_salary_data(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow checking own privileges
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- STRICTEST: Only FOUNDER and OWNER_ADMIN can access salary data
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('founder', 'owner_admin')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
END;
$$;
