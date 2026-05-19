-- Allow a broker (auth user) to SELECT their own crm_brokers row.
-- BrokerGuard needs this to detect is_active_broker / blocked_at after activation.
CREATE POLICY "Brokers can read their own registry row"
ON public.crm_brokers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());