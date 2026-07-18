DROP POLICY IF EXISTS "Authenticated users insert own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_own_update_non_billing" ON public.broker_subscriptions;

CREATE POLICY "Authenticated users insert own subscription non privileged"
ON public.broker_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(user_role, 'broker') NOT IN ('admin', 'owner', 'superadmin')
);

CREATE POLICY "Users update own non privileged subscription"
ON public.broker_subscriptions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE(user_role, 'broker') NOT IN ('admin', 'owner', 'superadmin')
)
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(user_role, 'broker') NOT IN ('admin', 'owner', 'superadmin')
);

DROP POLICY IF EXISTS "Admins can manage compliance words" ON public.jbj_compliance_words;
CREATE POLICY "Admins can manage compliance words"
ON public.jbj_compliance_words
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can view all access logs" ON public.jbj_lead_access_log;
CREATE POLICY "Admins can view all access logs"
ON public.jbj_lead_access_log
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.jbj_lead_assignment_queue;
CREATE POLICY "Admins can manage all assignments"
ON public.jbj_lead_assignment_queue
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can view all message audits" ON public.jbj_message_audit;
CREATE POLICY "Admins can view all message audits"
ON public.jbj_message_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jbj_brokers
    WHERE jbj_brokers.user_id = auth.uid()
      AND jbj_brokers.status = 'admin'
  )
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can manage market news" ON public.market_news;
CREATE POLICY "Admins can manage market news"
ON public.market_news
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);