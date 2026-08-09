DROP POLICY IF EXISTS "CRM members can view broker stats" ON public.broker_daily_stats;

CREATE POLICY "Admins can view broker stats"
ON public.broker_daily_stats
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_crm_admin(auth.uid())
);