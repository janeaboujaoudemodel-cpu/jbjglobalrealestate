-- Legacy guard referenced non-existent columns (started_at, stripe_customer_id,
-- stripe_subscription_id) on broker_subscriptions, which aborted EVERY insert/
-- update made by a signed-in non-admin. Enforcement now lives in
-- broker_subscriptions_lock_billing(); make the legacy guard a safe no-op.
CREATE OR REPLACE FUNCTION public.prevent_broker_subscription_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Superseded by public.broker_subscriptions_lock_billing()
  RETURN NEW;
END;
$$;