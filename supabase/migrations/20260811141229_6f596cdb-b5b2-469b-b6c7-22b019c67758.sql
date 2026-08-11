CREATE OR REPLACE FUNCTION public.broker_subscriptions_lock_billing()
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
    NEW.tier := 'starter';
    NEW.status := 'pending';
    NEW.price_usd := 0;
    NEW.ai_credits_limit := NULL;   -- assigned by backend/admin
    NEW.trial_ends_at := NULL;
    NEW.starts_at := NULL;
    NEW.expires_at := NULL;
    NEW.payment_method := NULL;
    NEW.payment_reference := NULL;
    NEW.user_role := 'broker';
    RETURN NEW;
  END IF;

  NEW.tier := OLD.tier;
  NEW.status := OLD.status;
  NEW.price_usd := OLD.price_usd;
  NEW.currency := OLD.currency;
  NEW.ai_credits_limit := OLD.ai_credits_limit;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.starts_at := OLD.starts_at;
  NEW.expires_at := OLD.expires_at;
  NEW.payment_method := OLD.payment_method;
  NEW.payment_reference := OLD.payment_reference;
  NEW.user_role := OLD.user_role;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

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
    NEW.tier_id := 'free';
    NEW.status := 'pending';
    -- expires_at is NOT NULL: store an already-expired stamp so a self-created
    -- row can never grant paid access until the backend confirms payment.
    NEW.expires_at := now();
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