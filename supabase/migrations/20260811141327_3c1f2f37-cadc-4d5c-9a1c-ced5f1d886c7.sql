CREATE OR REPLACE FUNCTION public.user_subscriptions_lock_billing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.jbj_caller_is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Lowest tier available in subscription_tiers (FK-safe).
    NEW.tier_id := COALESCE(
      (SELECT id FROM public.subscription_tiers ORDER BY display_order NULLS FIRST LIMIT 1),
      NEW.tier_id
    );
    NEW.status := 'pending';
    NEW.expires_at := now();   -- NOT NULL column: store already-expired
    NEW.stripe_subscription_id := NULL;
    NEW.stripe_customer_id := NULL;
    RETURN NEW;
  END IF;

  NEW.user_id := OLD.user_id;
  NEW.tier_id := OLD.tier_id;
  NEW.billing_period := OLD.billing_period;
  NEW.currency := OLD.currency;
  NEW.status := OLD.status;
  NEW.started_at := OLD.started_at;
  NEW.expires_at := OLD.expires_at;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  RETURN NEW;
END;
$$;