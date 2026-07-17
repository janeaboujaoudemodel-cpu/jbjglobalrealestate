
ALTER TABLE public.developer_documents ALTER COLUMN is_public SET DEFAULT false;

DROP POLICY IF EXISTS "Staff can read jbj leads" ON public.jbj_leads;
CREATE POLICY "Admins and owners can read jbj leads"
ON public.jbj_leads
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR (assigned_broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid()))
);
