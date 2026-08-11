-- Shared privilege check: service role, or admin/owner app_role
CREATE OR REPLACE FUNCTION public.jbj_caller_is_privileged()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  BEGIN
    r := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN others THEN
    r := NULL;
  END;
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN true;
  END IF;
  IF COALESCE(r, '') = 'service_role' THEN
    RETURN true;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'owner'::app_role);
END;
$$;

-- 1. broker_subscriptions: lock billing/tier columns
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
    NEW.ai_credits_limit := COALESCE((SELECT ai_credits_limit FROM public.broker_tier_definitions WHERE tier::text = 'starter' LIMIT 1), 0);
    NEW.trial_ends_at := NULL;
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

DROP TRIGGER IF EXISTS trg_broker_subscriptions_lock_billing ON public.broker_subscriptions;
CREATE TRIGGER trg_broker_subscriptions_lock_billing
BEFORE INSERT OR UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.broker_subscriptions_lock_billing();

-- 2. user_subscriptions: lock billing columns + tighten policies to authenticated
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
    NEW.expires_at := NULL;
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

DROP TRIGGER IF EXISTS trg_user_subscriptions_lock_billing ON public.user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_lock_billing
BEFORE INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.user_subscriptions_lock_billing();

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
ON public.user_subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 3. broker_verifications: force pending on self-insert
CREATE OR REPLACE FUNCTION public.broker_verifications_lock_review()
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
    NEW.status := 'pending';
    NEW.verified_at := NULL;
    NEW.admin_notes := NULL;
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.verified_at := OLD.verified_at;
  NEW.admin_notes := OLD.admin_notes;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_verifications_lock_review ON public.broker_verifications;
CREATE TRIGGER trg_broker_verifications_lock_review
BEFORE INSERT OR UPDATE ON public.broker_verifications
FOR EACH ROW EXECUTE FUNCTION public.broker_verifications_lock_review();

DROP POLICY IF EXISTS "Users can insert their own verification" ON public.broker_verifications;
CREATE POLICY "Users can insert their own verification"
ON public.broker_verifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND COALESCE(status, 'pending') = 'pending');

-- 4. developer_applications: force pending on self-insert
CREATE OR REPLACE FUNCTION public.developer_applications_lock_review()
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
    NEW.status := 'pending';
    NEW.admin_notes := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.admin_notes := OLD.admin_notes;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.applicant_user_id := OLD.applicant_user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developer_applications_lock_review ON public.developer_applications;
CREATE TRIGGER trg_developer_applications_lock_review
BEFORE INSERT OR UPDATE ON public.developer_applications
FOR EACH ROW EXECUTE FUNCTION public.developer_applications_lock_review();

DROP POLICY IF EXISTS "dev_apps_applicant_insert" ON public.developer_applications;
CREATE POLICY "dev_apps_applicant_insert"
ON public.developer_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = applicant_user_id AND COALESCE(status, 'pending') = 'pending');

-- 5. user_verifications: force pending on self-insert, lock review fields
CREATE OR REPLACE FUNCTION public.user_verifications_lock_review()
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
    NEW.status := 'pending';
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.risk_score := NULL;
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_verifications_lock_review ON public.user_verifications;
CREATE TRIGGER trg_user_verifications_lock_review
BEFORE INSERT OR UPDATE ON public.user_verifications
FOR EACH ROW EXECUTE FUNCTION public.user_verifications_lock_review();

DROP POLICY IF EXISTS "Users can insert own verification" ON public.user_verifications;
CREATE POLICY "Users can insert own verification"
ON public.user_verifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND COALESCE(status, 'pending') = 'pending');