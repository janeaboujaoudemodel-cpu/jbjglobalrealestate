-- Fix new_joiner_applications: Restrict to HR/IT only (not sales_director)
DROP POLICY IF EXISTS "Admins and IT can view all applications" ON public.new_joiner_applications;
DROP POLICY IF EXISTS "Authorized users can create applications" ON public.new_joiner_applications;
DROP POLICY IF EXISTS "IT and admins can update applications" ON public.new_joiner_applications;

-- SELECT: Only HR admins, IT department, or the requester can view
CREATE POLICY "hr_it_view_applications"
ON public.new_joiner_applications FOR SELECT
TO authenticated
USING (
  public.is_hr_admin_strict(auth.uid())
  OR requested_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND department = 'IT'
  )
);

-- INSERT: Only HR admins and IT staff can create
CREATE POLICY "hr_it_insert_applications"
ON public.new_joiner_applications FOR INSERT
TO authenticated
WITH CHECK (
  public.is_hr_admin_strict(auth.uid())
  OR EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND department = 'IT'
  )
);

-- UPDATE: Only HR admins and IT staff can update
CREATE POLICY "hr_it_update_applications"
ON public.new_joiner_applications FOR UPDATE
TO authenticated
USING (
  public.is_hr_admin_strict(auth.uid())
  OR EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND department = 'IT'
  )
);

-- DELETE: Only owner can delete
CREATE POLICY "owner_delete_applications"
ON public.new_joiner_applications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));