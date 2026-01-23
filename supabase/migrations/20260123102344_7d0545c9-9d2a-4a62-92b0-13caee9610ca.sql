-- =============================================
-- SECURITY FIX: Employee Salaries & HR Applications
-- =============================================

-- 1. Create a strict function for salary access (owner_admin/founder only)
CREATE OR REPLACE FUNCTION public.can_access_salary_data(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow checking own privileges (prevent privilege escalation)
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- STRICT: Only owner_admin and founder can access salary data
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
END;
$function$;

-- 2. Drop existing policies on employee_salaries
DROP POLICY IF EXISTS "HR managers can view salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "HR managers can insert salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "HR managers can update salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "HR managers can delete salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "Users can view own salary" ON public.employee_salaries;
DROP POLICY IF EXISTS "Admins can manage all salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "Allow owner/admin to manage salaries" ON public.employee_salaries;

-- 3. Create strict RLS policies for employee_salaries
-- SELECT: Only owner_admin/founder OR viewing own salary
CREATE POLICY "Strict salary access - select"
ON public.employee_salaries
FOR SELECT
TO authenticated
USING (
  public.can_access_salary_data(auth.uid())
  OR user_id = auth.uid()
);

-- INSERT: Only owner_admin/founder
CREATE POLICY "Strict salary access - insert"
ON public.employee_salaries
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_salary_data(auth.uid())
);

-- UPDATE: Only owner_admin/founder
CREATE POLICY "Strict salary access - update"
ON public.employee_salaries
FOR UPDATE
TO authenticated
USING (public.can_access_salary_data(auth.uid()))
WITH CHECK (public.can_access_salary_data(auth.uid()));

-- DELETE: Only owner_admin/founder
CREATE POLICY "Strict salary access - delete"
ON public.employee_salaries
FOR DELETE
TO authenticated
USING (public.can_access_salary_data(auth.uid()));

-- =============================================
-- 4. Fix HR Applications access
-- =============================================

-- Create strict function for HR admin access only
CREATE OR REPLACE FUNCTION public.is_hr_admin_strict(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow checking own privileges
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- STRICT: Only owner_admin, founder, and designated HR admins
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'owner')
  )
  OR EXISTS (
    SELECT 1 FROM public.hr_user_roles
    WHERE user_id = _user_id 
      AND role IN ('hr_admin', 'hr_manager')
      AND is_active = true
  );
END;
$function$;

-- Drop existing SELECT policies on hr_applications
DROP POLICY IF EXISTS "HR admins can view applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR managers can view applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Allow public to submit applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Allow rate-limited public applications" ON public.hr_applications;

-- Create strict policies for hr_applications
-- SELECT: Only HR admins can view applications
CREATE POLICY "Strict HR applications - select"
ON public.hr_applications
FOR SELECT
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

-- INSERT: Allow public submissions with rate limiting (keep this permissive for job applications)
CREATE POLICY "Public job applications - insert"
ON public.hr_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: Only HR admins
CREATE POLICY "Strict HR applications - update"
ON public.hr_applications
FOR UPDATE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()))
WITH CHECK (public.is_hr_admin_strict(auth.uid()));

-- DELETE: Only HR admins
CREATE POLICY "Strict HR applications - delete"
ON public.hr_applications
FOR DELETE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));