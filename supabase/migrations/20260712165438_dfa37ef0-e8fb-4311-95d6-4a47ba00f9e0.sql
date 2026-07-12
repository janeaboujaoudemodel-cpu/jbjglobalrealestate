
DROP POLICY IF EXISTS owner_or_rm_update ON public.vip_clients;
CREATE POLICY owner_or_rm_update ON public.vip_clients
  FOR UPDATE
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
