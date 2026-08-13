CREATE OR REPLACE FUNCTION public.lock_broker_subscription_privileged()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  is_privileged := auth.role() = 'service_role'
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner');

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := 'starter';
    NEW.status := 'pending';
    NEW.price_usd := 0;
    NEW.ai_credits_limit := COALESCE((SELECT ai_credits_limit FROM public.broker_subscriptions WHERE false), 0);
    NEW.expires_at := NULL;
  ELSE
    NEW.tier := OLD.tier;
    NEW.status := OLD.status;
    NEW.price_usd := OLD.price_usd;
    NEW.ai_credits_limit := OLD.ai_credits_limit;
    NEW.expires_at := OLD.expires_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_broker_subscription_privileged ON public.broker_subscriptions;
CREATE TRIGGER trg_lock_broker_subscription_privileged
BEFORE INSERT OR UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.lock_broker_subscription_privileged();