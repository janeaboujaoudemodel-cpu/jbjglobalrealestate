-- Fix critical RLS bug: crm_leads_own_or_assigned_select has wrong join (cla.lead_id = cla.id instead of cla.lead_id = crm_leads.id)
DROP POLICY IF EXISTS "crm_leads_own_or_assigned_select" ON public.crm_leads;

CREATE POLICY "crm_leads_own_or_assigned_select"
ON public.crm_leads
FOR SELECT
TO authenticated
USING (
  (auth.uid() = owner_user_id)
  OR (auth.uid() = created_by_user_id)
  OR (EXISTS (
    SELECT 1
    FROM crm_lead_assignments cla
    WHERE cla.lead_id = crm_leads.id
      AND cla.assigned_to_user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);