
-- Helper: check if current session is admin/owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','owner','super_admin')
  );
END;
$$;

-- broker_profiles: protect verification/tier/status fields
CREATE OR REPLACE FUNCTION public.protect_broker_profiles_status_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_owner() THEN
    RETURN NEW;
  END IF;
  NEW.verification_status := OLD.verification_status;
  NEW.is_public := OLD.is_public;
  NEW.current_tier := OLD.current_tier;
  NEW.total_points := OLD.total_points;
  NEW.performance_rating := OLD.performance_rating;
  NEW.probation_end := OLD.probation_end;
  NEW.probation_skipped := OLD.probation_skipped;
  NEW.custom_title := OLD.custom_title;
  NEW.custom_label := OLD.custom_label;
  NEW.rera_expiry_date := OLD.rera_expiry_date;
  NEW.id_expiry_date := OLD.id_expiry_date;
  NEW.broker_type := OLD.broker_type;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_broker_profiles_status ON public.broker_profiles;
CREATE TRIGGER trg_protect_broker_profiles_status
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_broker_profiles_status_fields();

-- broker_subscriptions: protect billing fields
CREATE OR REPLACE FUNCTION public.protect_broker_subscriptions_billing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_owner() THEN
    RETURN NEW;
  END IF;
  NEW.tier := OLD.tier;
  NEW.status := OLD.status;
  NEW.price_usd := OLD.price_usd;
  NEW.ai_credits_limit := OLD.ai_credits_limit;
  NEW.ai_credits_used := OLD.ai_credits_used;
  NEW.expires_at := OLD.expires_at;
  NEW.payment_reference := OLD.payment_reference;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_broker_subscriptions_billing ON public.broker_subscriptions;
CREATE TRIGGER trg_protect_broker_subscriptions_billing
BEFORE UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.protect_broker_subscriptions_billing();

-- profiles: protect verification and tier
CREATE OR REPLACE FUNCTION public.protect_profiles_verification_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_owner() THEN
    RETURN NEW;
  END IF;
  NEW.is_verified := OLD.is_verified;
  NEW.verification_status := OLD.verification_status;
  NEW.client_tier := OLD.client_tier;
  NEW.broker_tier := OLD.broker_tier;
  NEW.first_deal_verified := OLD.first_deal_verified;
  NEW.login_streak := OLD.login_streak;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_verification_tier ON public.profiles;
CREATE TRIGGER trg_protect_profiles_verification_tier
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profiles_verification_tier();

-- referral_partners: protect approval and financial fields
CREATE OR REPLACE FUNCTION public.protect_referral_partners_financial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_owner() THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.commission_rate := OLD.commission_rate;
  NEW.approved_at := OLD.approved_at;
  NEW.approved_by := OLD.approved_by;
  NEW.total_earnings_aed := OLD.total_earnings_aed;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_referral_partners_financial ON public.referral_partners;
CREATE TRIGGER trg_protect_referral_partners_financial
BEFORE UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.protect_referral_partners_financial();

-- user_interest_profile: protect lead-scoring fields
CREATE OR REPLACE FUNCTION public.protect_user_interest_profile_scoring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_owner() THEN
    RETURN NEW;
  END IF;
  NEW.vip_tier := OLD.vip_tier;
  NEW.conversion_probability := OLD.conversion_probability;
  NEW.revenue_potential := OLD.revenue_potential;
  NEW.engagement_score := OLD.engagement_score;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_interest_profile_scoring ON public.user_interest_profile;
CREATE TRIGGER trg_protect_user_interest_profile_scoring
BEFORE UPDATE ON public.user_interest_profile
FOR EACH ROW EXECUTE FUNCTION public.protect_user_interest_profile_scoring();
