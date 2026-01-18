-- Drop ALL existing crm_leads SELECT policies
DROP POLICY IF EXISTS "CRM users access own or assigned leads" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_strict_select" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can only read leads they own or are assigned to" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_own_or_assigned_select" ON public.crm_leads;

-- Create strict SELECT policy for crm_leads with correct column name
CREATE POLICY "crm_leads_own_or_assigned_select"
ON public.crm_leads FOR SELECT
USING (
  auth.uid() = owner_user_id
  OR auth.uid() = created_by_user_id
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments cla
    WHERE cla.lead_id = id AND cla.assigned_to_user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'owner')
);