-- =====================================================
-- FIX 1: leads table - Restrict SELECT to authorized staff only
-- =====================================================

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Leads are publicly readable" ON public.leads;
DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
DROP POLICY IF EXISTS "Public can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authorized staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Rate-limited public lead insertion" ON public.leads;
DROP POLICY IF EXISTS "Authorized staff can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and owners can delete leads" ON public.leads;

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- SELECT: Only authorized staff can view leads
CREATE POLICY "Authorized staff can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_authorized_staff());

-- INSERT: Public can insert with rate limiting
CREATE POLICY "Rate-limited public lead insertion"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (public.check_lead_rate_limit(email, 3, 24));

-- UPDATE: Only authorized staff
CREATE POLICY "Authorized staff can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.is_authorized_staff());

-- DELETE: Only admins and owners
CREATE POLICY "Admins and owners can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- =====================================================
-- FIX 2: hr_employees table - Proper RLS protection
-- =====================================================

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "HR employees are viewable by everyone" ON public.hr_employees;
DROP POLICY IF EXISTS "Anyone can view hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Public can view hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can view all employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Employees can view own record" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can insert employees" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can update employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Employees can update own limited fields" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can delete employees" ON public.hr_employees;

-- Ensure RLS is enabled
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

-- SELECT: HR admins/managers can view all, employees can view themselves
CREATE POLICY "HR admins can view all employees"
ON public.hr_employees
FOR SELECT
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

CREATE POLICY "Employees can view own record"
ON public.hr_employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Only HR admins can add employees
CREATE POLICY "HR admins can insert employees"
ON public.hr_employees
FOR INSERT
TO authenticated
WITH CHECK (public.is_hr_admin_strict(auth.uid()));

-- UPDATE: HR admins can update all, employees have limited self-update
CREATE POLICY "HR admins can update employees"
ON public.hr_employees
FOR UPDATE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

-- DELETE: Only HR admins
CREATE POLICY "HR admins can delete employees"
ON public.hr_employees
FOR DELETE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));