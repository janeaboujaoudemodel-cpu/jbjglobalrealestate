-- Fix RLS for leads table - restrict SELECT to admins only (use valid enum values)
DROP POLICY IF EXISTS "leads_admin_select" ON public.leads;

CREATE POLICY "leads_admin_select"
ON public.leads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);