DROP POLICY IF EXISTS crm_leads_strict_insert ON public.crm_leads;

CREATE POLICY crm_leads_strict_insert
ON public.crm_leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid()
      AND crm_users_profile.is_active = true
  )
  AND created_by_user_id = auth.uid()
  AND (
    owner_user_id IS NULL
    OR owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'owner'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_crm_admin(auth.uid())
  )
);