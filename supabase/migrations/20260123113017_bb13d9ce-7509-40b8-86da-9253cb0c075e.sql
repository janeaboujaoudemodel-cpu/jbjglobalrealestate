-- =====================================================
-- FIX: leads table - Ensure RLS is properly configured
-- =====================================================

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Leads are publicly readable" ON public.leads;
DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
DROP POLICY IF EXISTS "Public can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authorized staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Rate-limited public lead insertion" ON public.leads;
DROP POLICY IF EXISTS "Authorized staff can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and owners can delete leads" ON public.leads;
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- SELECT: Only authorized staff can view leads
CREATE POLICY "staff_view_leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_authorized_staff());

-- INSERT: Public can insert with rate limiting (for contact forms)
CREATE POLICY "rate_limited_insert_leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (public.check_lead_rate_limit(email, 3, 24));

-- UPDATE: Only authorized staff
CREATE POLICY "staff_update_leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.is_authorized_staff());

-- DELETE: Only admins and owners
CREATE POLICY "admin_delete_leads"
ON public.leads
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- =====================================================
-- FIX: hr_employees table - Proper RLS protection
-- =====================================================

DROP POLICY IF EXISTS "HR employees are viewable by everyone" ON public.hr_employees;
DROP POLICY IF EXISTS "Anyone can view hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can view all employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Employees can view own record" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can insert employees" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can update employees" ON public.hr_employees;
DROP POLICY IF EXISTS "HR admins can delete employees" ON public.hr_employees;

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees FORCE ROW LEVEL SECURITY;

-- SELECT: HR admins see all, employees see themselves
CREATE POLICY "hr_admin_view_employees"
ON public.hr_employees
FOR SELECT
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

CREATE POLICY "employee_view_own"
ON public.hr_employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Only HR admins
CREATE POLICY "hr_admin_insert_employees"
ON public.hr_employees
FOR INSERT
TO authenticated
WITH CHECK (public.is_hr_admin_strict(auth.uid()));

-- UPDATE: HR admins only
CREATE POLICY "hr_admin_update_employees"
ON public.hr_employees
FOR UPDATE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

-- DELETE: HR admins only
CREATE POLICY "hr_admin_delete_employees"
ON public.hr_employees
FOR DELETE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));