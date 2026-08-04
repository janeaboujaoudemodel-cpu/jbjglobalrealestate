DROP POLICY IF EXISTS "CRM admins can create shares" ON public.crm_lead_shares;

CREATE POLICY "Users can share leads they can access"
ON public.crm_lead_shares
FOR INSERT
TO authenticated
WITH CHECK (
  shared_by = auth.uid()
  AND public.can_access_crm_lead(auth.uid(), lead_id)
);