
-- 1. Restrict crm_field_permissions SELECT to owner only
DROP POLICY IF EXISTS "CRM members can read field permissions" ON public.crm_field_permissions;
CREATE POLICY "Owner can read field permissions"
  ON public.crm_field_permissions FOR SELECT
  USING (has_role(auth.uid(), 'owner'::app_role));

-- 2. Helper: check if current writer is privileged (owner role or service role)
CREATE OR REPLACE FUNCTION public.is_privileged_writer()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN true;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role);
END;
$$;

-- 3. broker_profiles: block self-verify / tier / points changes
CREATE OR REPLACE FUNCTION public.prevent_broker_profile_self_verify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;
  NEW.verification_status := OLD.verification_status;
  NEW.current_tier := OLD.current_tier;
  NEW.total_points := OLD.total_points;
  NEW.performance_rating := OLD.performance_rating;
  IF TG_OP = 'UPDATE' AND to_jsonb(NEW) ? 'face_verified' THEN
    NEW.face_verified := OLD.face_verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_broker_profile_self_verify ON public.broker_profiles;
CREATE TRIGGER prevent_broker_profile_self_verify
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_broker_profile_self_verify();

-- 4. broker_subscriptions: block self-upgrade of billing fields
CREATE OR REPLACE FUNCTION public.prevent_broker_subscription_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;
  NEW.tier := OLD.tier;
  NEW.status := OLD.status;
  NEW.price_usd := OLD.price_usd;
  NEW.ai_credits_limit := OLD.ai_credits_limit;
  NEW.ai_credits_used := OLD.ai_credits_used;
  NEW.expires_at := OLD.expires_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_broker_subscription_self_upgrade ON public.broker_subscriptions;
CREATE TRIGGER prevent_broker_subscription_self_upgrade
  BEFORE UPDATE ON public.broker_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_broker_subscription_self_upgrade();

-- 5. referral_partners: block self-update of financial/status fields
CREATE OR REPLACE FUNCTION public.prevent_referral_partner_self_financial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;
  NEW.commission_rate := OLD.commission_rate;
  NEW.status := OLD.status;
  NEW.total_earnings_aed := OLD.total_earnings_aed;
  NEW.total_conversions := OLD.total_conversions;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_referral_partner_self_financial ON public.referral_partners;
CREATE TRIGGER prevent_referral_partner_self_financial
  BEFORE UPDATE ON public.referral_partners
  FOR EACH ROW EXECUTE FUNCTION public.prevent_referral_partner_self_financial();

-- 6. user_interest_profile: block self-VIP / marketing-score inflation
CREATE OR REPLACE FUNCTION public.prevent_uip_vip_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;
  NEW.vip_tier := OLD.vip_tier;
  NEW.vip_override := OLD.vip_override;
  NEW.engagement_score := OLD.engagement_score;
  NEW.conversion_probability := OLD.conversion_probability;
  NEW.revenue_potential := OLD.revenue_potential;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_uip_vip_self_update ON public.user_interest_profile;
CREATE TRIGGER prevent_uip_vip_self_update
  BEFORE UPDATE ON public.user_interest_profile
  FOR EACH ROW EXECUTE FUNCTION public.prevent_uip_vip_self_update();
