-- Allow any authenticated user (e.g. brokers) to create leads they own/created themselves.
-- Owners/admins keep full insert rights via the existing crm_leads_strict_insert policy.
DROP POLICY IF EXISTS "crm_leads_self_insert" ON public.crm_leads;
CREATE POLICY "crm_leads_self_insert"
ON public.crm_leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by_user_id = auth.uid()
  AND (owner_user_id IS NULL OR owner_user_id = auth.uid())
);