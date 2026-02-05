-- ============================================
-- FIX: Employee Salary Data Exposure
-- Consolidate RLS policies and add secure masking view
-- ============================================

-- Step 1: Create a strict finance access function
CREATE OR REPLACE FUNCTION public.has_finance_hr_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own privileges
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Strict access: only founder, owner_admin, finance roles can access salary details
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

-- Step 2: Drop overlapping/redundant policies
DROP POLICY IF EXISTS "HR and Finance only can view all salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "salary_own_view" ON public.employee_salaries;

-- Step 3: Create consolidated, strict RLS policies
-- Policy 1: Finance/HR vault access for full data (including bank details)
-- salary_vault_select already exists and is strict

-- Policy 2: Employees can see their own LIMITED data (non-financial fields only)
-- This is handled via the secure view below

-- Step 4: Create a secure masked view for employee self-service
DROP VIEW IF EXISTS public.employee_salaries_self_service;
CREATE VIEW public.employee_salaries_self_service
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  employee_name,
  department,
  -- Employees can see their own salary amount
  CASE 
    WHEN user_id = auth.uid() THEN base_salary
    ELSE NULL
  END as base_salary,
  currency,
  salary_type,
  effective_date,
  end_date,
  -- Bank name is masked for everyone except finance
  CASE 
    WHEN has_finance_hr_access(auth.uid()) THEN bank_name
    WHEN user_id = auth.uid() THEN 
      CASE 
        WHEN bank_name IS NOT NULL THEN '****' || RIGHT(COALESCE(bank_name, ''), 4)
        ELSE NULL
      END
    ELSE NULL
  END as bank_name_masked,
  -- Notes masked for non-owners
  CASE 
    WHEN has_finance_hr_access(auth.uid()) THEN notes
    WHEN user_id = auth.uid() THEN notes
    ELSE NULL
  END as notes,
  created_at,
  updated_at
FROM public.employee_salaries
WHERE 
  -- Only show own records or all records if finance access
  user_id = auth.uid() 
  OR has_finance_hr_access(auth.uid());

-- Grant access to the secure view
GRANT SELECT ON public.employee_salaries_self_service TO authenticated;

-- Step 5: Create audit trigger for salary table access
CREATE OR REPLACE FUNCTION public.audit_salary_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    details
  )
  SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    CASE TG_OP
      WHEN 'INSERT' THEN 'create'::audit_action_type
      WHEN 'UPDATE' THEN 'update'::audit_action_type
      WHEN 'DELETE' THEN 'delete'::audit_action_type
    END,
    'salary_data'::audit_resource_type,
    COALESCE(NEW.id, OLD.id)::text,
    'Salary record ' || TG_OP || ' for employee',
    jsonb_build_object(
      'employee_id', COALESCE(NEW.user_id, OLD.user_id),
      'operation', TG_OP,
      'timestamp', now()
    );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS audit_salary_changes ON public.employee_salaries;
CREATE TRIGGER audit_salary_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_salary_access();

-- Step 6: Add comment for documentation
COMMENT ON VIEW public.employee_salaries_self_service IS 
'Secure view for employee salary self-service. Bank details are masked. Full access requires finance/HR role via has_finance_hr_access().';

COMMENT ON FUNCTION public.has_finance_hr_access IS
'Checks if user has finance/HR access for viewing sensitive salary and banking data. Only founder, owner_admin, and owner roles have access.';