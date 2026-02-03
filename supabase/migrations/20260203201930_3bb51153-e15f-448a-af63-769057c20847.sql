-- Harden hr_employees RLS policies - consolidate to strict access control
-- Only HR admins and the employee themselves should access this data

-- First, drop all existing policies on hr_employees to start fresh
DROP POLICY IF EXISTS "Admins can manage hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Admins can view hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Deny anonymous read access to hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "employee_view_own" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_admin_delete_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_admin_insert_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_admin_update_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_admin_view_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_admin_all" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_creator_select" ON public.hr_employees;
DROP POLICY IF EXISTS "hr_employees_hr_manager_select" ON public.hr_employees;

-- Ensure RLS is enabled
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

-- Create streamlined, secure policies

-- 1. Anonymous users: explicitly deny all access
CREATE POLICY "hr_employees_anon_deny"
ON public.hr_employees
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. HR Admins (strict): full access to all employee records
-- Uses existing is_hr_admin_strict function which checks for proper HR admin roles
CREATE POLICY "hr_employees_hr_admin_all"
ON public.hr_employees
FOR ALL
TO authenticated
USING (is_hr_admin_strict(auth.uid()))
WITH CHECK (is_hr_admin_strict(auth.uid()));

-- 3. Owner/Founder role: full access for executive oversight
-- Uses has_role function to check app_role
CREATE POLICY "hr_employees_owner_founder_all"
ON public.hr_employees
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- 4. Employees: can only view their own record (no update/delete)
CREATE POLICY "hr_employees_self_view"
ON public.hr_employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add audit logging for sensitive access
-- Create trigger function to log access to hr_employees if not exists
CREATE OR REPLACE FUNCTION log_hr_employee_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to audit_logs for compliance
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    details
  )
  VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    CASE TG_OP
      WHEN 'INSERT' THEN 'create'::audit_action_type
      WHEN 'UPDATE' THEN 'update'::audit_action_type
      WHEN 'DELETE' THEN 'delete'::audit_action_type
    END,
    'hr_record'::audit_resource_type,
    COALESCE(NEW.id, OLD.id),
    'HR employee record ' || TG_OP || ' by user',
    jsonb_build_object(
      'employee_name', COALESCE(NEW.full_name, OLD.full_name),
      'operation', TG_OP,
      'table', 'hr_employees'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS hr_employees_audit_trigger ON public.hr_employees;
CREATE TRIGGER hr_employees_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.hr_employees
FOR EACH ROW
EXECUTE FUNCTION log_hr_employee_access();

-- Grant appropriate permissions
REVOKE ALL ON public.hr_employees FROM anon;
GRANT SELECT ON public.hr_employees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hr_employees TO authenticated;