
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.suspicious_admin_alerts;
DROP POLICY IF EXISTS "suspicious_alerts_insert" ON public.suspicious_admin_alerts;

CREATE POLICY "Users insert own suspicious alerts"
ON public.suspicious_admin_alerts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
