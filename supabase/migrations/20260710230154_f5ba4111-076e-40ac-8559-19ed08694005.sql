-- Security hardening for broker self-service privilege escalation.
-- Uses triggers because row-level rules cannot restrict individual columns.

CREATE OR REPLACE FUNCTION public._caller_is_privileged()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN true;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN true;
  END IF;
  RETURN public.has_role(auth.uid(), 'owner'::public.app_role)
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_owner_user();
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Broker profiles: non-privileged users cannot self-verify or inflate trust/performance fields.
CREATE OR REPLACE FUNCTION public.tg_broker_profiles_trust_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.current_tier := COALESCE(NEW.current_tier, 'Starter');
    NEW.total_points := COALESCE(NEW.total_points, 0);
    NEW.tier_updated_at := NULL;
    NEW.verification_status := COALESCE(NEW.verification_status, 'unverified');
    NEW.face_verified := COALESCE(NEW.face_verified, false);
    NEW.probation_start := NULL;
    NEW.probation_end := NULL;
    NEW.probation_months := COALESCE(NEW.probation_months, 3);
    NEW.performance_rating := COALESCE(NEW.performance_rating, 'new');
    NEW.probation_skipped := COALESCE(NEW.probation_skipped, false);
    NEW.face_verification_status := COALESCE(NEW.face_verification_status, 'pending');
    RETURN NEW;
  END IF;

  NEW.current_tier := OLD.current_tier;
  NEW.total_points := OLD.total_points;
  NEW.tier_updated_at := OLD.tier_updated_at;
  NEW.verification_status := OLD.verification_status;
  NEW.face_verified := OLD.face_verified;
  NEW.probation_start := OLD.probation_start;
  NEW.probation_end := OLD.probation_end;
  NEW.probation_months := OLD.probation_months;
  NEW.performance_rating := OLD.performance_rating;
  NEW.probation_skipped := OLD.probation_skipped;
  NEW.face_verification_status := OLD.face_verification_status;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broker_profiles_trust_guard ON public.broker_profiles;
CREATE TRIGGER broker_profiles_trust_guard
BEFORE INSERT OR UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_broker_profiles_trust_guard();

DROP POLICY IF EXISTS "Users can manage own broker profile" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can update own broker profile" ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_own_update ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_user_all ON public.broker_profiles;
DROP POLICY IF EXISTS "Admins can manage all broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_admin_all ON public.broker_profiles;

CREATE POLICY broker_profiles_admin_all
ON public.broker_profiles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY broker_profiles_own_update_contact_only
ON public.broker_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Broker subscriptions: non-privileged users cannot self-upgrade billing/subscription fields.
CREATE OR REPLACE FUNCTION public.tg_broker_subscriptions_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := 'starter';
    NEW.status := 'pending';
    NEW.price_usd := 0;
    NEW.payment_method := NULL;
    NEW.payment_reference := NULL;
    NEW.trial_ends_at := NULL;
    NEW.starts_at := NULL;
    NEW.expires_at := NULL;
    NEW.ai_credits_limit := NULL;
    NEW.user_role := COALESCE(NEW.user_role, 'broker');
    RETURN NEW;
  END IF;

  NEW.tier := OLD.tier;
  NEW.status := OLD.status;
  NEW.price_usd := OLD.price_usd;
  NEW.payment_method := OLD.payment_method;
  NEW.payment_reference := OLD.payment_reference;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.starts_at := OLD.starts_at;
  NEW.expires_at := OLD.expires_at;
  NEW.ai_credits_limit := OLD.ai_credits_limit;
  NEW.user_role := OLD.user_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broker_subscriptions_guard ON public.broker_subscriptions;
CREATE TRIGGER broker_subscriptions_guard
BEFORE INSERT OR UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_broker_subscriptions_guard();

DROP POLICY IF EXISTS "Authenticated users update own subscription or admins all" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.broker_subscriptions;

CREATE POLICY broker_subscriptions_admin_update
ON public.broker_subscriptions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY broker_subscriptions_own_update_non_billing
ON public.broker_subscriptions
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Referral partners: non-privileged partners cannot self-approve or edit payout fields.
CREATE OR REPLACE FUNCTION public.tg_referral_partners_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.commission_rate := COALESCE(NEW.commission_rate, 5.00);
    NEW.total_referrals := 0;
    NEW.total_conversions := 0;
    NEW.total_earnings_aed := 0;
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
    NEW.contract_signed_at := NULL;
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.commission_rate := OLD.commission_rate;
  NEW.total_earnings_aed := OLD.total_earnings_aed;
  NEW.total_referrals := OLD.total_referrals;
  NEW.total_conversions := OLD.total_conversions;
  NEW.partner_type := OLD.partner_type;
  NEW.approved_at := OLD.approved_at;
  NEW.approved_by := OLD.approved_by;
  NEW.referral_code := OLD.referral_code;
  NEW.contract_signed_at := OLD.contract_signed_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_partners_guard ON public.referral_partners;
CREATE TRIGGER referral_partners_guard
BEFORE INSERT OR UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.tg_referral_partners_guard();

DROP POLICY IF EXISTS partner_update_own ON public.referral_partners;
CREATE POLICY partner_update_own_non_financial
ON public.referral_partners
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());