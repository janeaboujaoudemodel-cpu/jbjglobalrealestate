-- Remove overly permissive public insert policies from leads table
-- Leads should ONLY be inserted via the capture-lead edge function (which uses service_role)

DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Public insert leads with validation" ON public.leads;

-- Add a policy that only allows service role or authenticated admins to insert
-- (Service role bypasses RLS anyway, but this documents the intent)
CREATE POLICY "Only backend can insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);