-- Update is_crm_admin function to include sales_director for CV Center access
CREATE OR REPLACE FUNCTION public.is_crm_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
      AND is_active = true
  )
$$;

-- Create is_hr_manager function for HR access checks
CREATE OR REPLACE FUNCTION public.is_hr_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'owner')
  )
$$;

-- Add policy for sales_director to view HR applications
DROP POLICY IF EXISTS "Sales directors can view hr_applications" ON public.hr_applications;
CREATE POLICY "Sales directors can view hr_applications" 
ON public.hr_applications 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role = 'sales_director'
    AND is_active = true
  )
);