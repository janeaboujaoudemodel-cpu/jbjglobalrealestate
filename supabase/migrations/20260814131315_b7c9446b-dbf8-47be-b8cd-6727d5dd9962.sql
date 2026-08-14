-- Escalation lock: brokers/users cannot grant themselves paid tiers.

CREATE OR REPLACE FUNCTION public.lock_broker_subscription_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  is_privileged := auth.role() = 'service_role'
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := 'starter';
    NEW.status := 'pending';
    NEW.price_usd := 0;
    NEW.ai_credits_limit := NULL;
    NEW.ai_credits_used := 0;
    NEW.pdf_downloads := 0;
    NEW.payment_reference := NULL;
    NEW.trial_ends_at := NULL;
    NEW.starts_at := NULL;
    NEW.expires_at := NULL;
  ELSE
    NEW.tier := OLD.tier;
    NEW.status := OLD.status;
    NEW.price_usd := OLD.price_usd;
    NEW.ai_credits_limit := OLD.ai_credits_limit;
    NEW.payment_reference := OLD.payment_reference;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.starts_at := OLD.starts_at;
    NEW.expires_at := OLD.expires_at;
    NEW.user_role := OLD.user_role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_broker_subscription_escalation ON public.broker_subscriptions;
CREATE TRIGGER lock_broker_subscription_escalation
BEFORE INSERT OR UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.lock_broker_subscription_escalation();

CREATE OR REPLACE FUNCTION public.lock_user_subscription_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  is_privileged := auth.role() = 'service_role'
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier_id := 'free';
    NEW.status := 'active';
    NEW.billing_period := NULL;
    NEW.expires_at := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.stripe_customer_id := NULL;
  ELSE
    NEW.tier_id := OLD.tier_id;
    NEW.status := OLD.status;
    NEW.billing_period := OLD.billing_period;
    NEW.expires_at := OLD.expires_at;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.started_at := OLD.started_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_user_subscription_escalation ON public.user_subscriptions;
CREATE TRIGGER lock_user_subscription_escalation
BEFORE INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.lock_user_subscription_escalation();