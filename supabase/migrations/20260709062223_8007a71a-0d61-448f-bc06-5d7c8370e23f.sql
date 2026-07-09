
-- Guard function: true when caller is privileged (owner/admin/super_admin) or service_role
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
    RETURN true; -- server-side / no JWT context
  END IF;
  RETURN public.is_owner_user();
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- broker_subscriptions: block self-edit of billing fields
CREATE OR REPLACE FUNCTION public.tg_broker_subscriptions_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._caller_is_privileged() THEN
    NEW.tier := OLD.tier;
    NEW.status := OLD.status;
    NEW.ai_credits_limit := OLD.ai_credits_limit;
    NEW.expires_at := OLD.expires_at;
    NEW.starts_at := OLD.starts_at;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.price_usd := OLD.price_usd;
    NEW.payment_method := OLD.payment_method;
    NEW.payment_reference := OLD.payment_reference;
    NEW.user_role := OLD.user_role;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS broker_subscriptions_guard ON public.broker_subscriptions;
CREATE TRIGGER broker_subscriptions_guard BEFORE UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_broker_subscriptions_guard();

-- user_subscriptions: block self-edit of billing fields
CREATE OR REPLACE FUNCTION public.tg_user_subscriptions_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._caller_is_privileged() THEN
    NEW.tier_id := OLD.tier_id;
    NEW.status := OLD.status;
    NEW.expires_at := OLD.expires_at;
    NEW.started_at := OLD.started_at;
    NEW.billing_period := OLD.billing_period;
    NEW.currency := OLD.currency;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS user_subscriptions_guard ON public.user_subscriptions;
CREATE TRIGGER user_subscriptions_guard BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_user_subscriptions_guard();

-- referral_partners: block self-approve / commission bump
CREATE OR REPLACE FUNCTION public.tg_referral_partners_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._caller_is_privileged() THEN
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
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS referral_partners_guard ON public.referral_partners;
CREATE TRIGGER referral_partners_guard BEFORE UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.tg_referral_partners_guard();

-- profiles: block self-edit of trust / tier flags
CREATE OR REPLACE FUNCTION public.tg_profiles_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._caller_is_privileged() THEN
    NEW.is_verified := OLD.is_verified;
    NEW.verified_at := OLD.verified_at;
    NEW.verification_status := OLD.verification_status;
    NEW.first_deal_verified := OLD.first_deal_verified;
    NEW.first_deal_verified_at := OLD.first_deal_verified_at;
    NEW.client_tier := OLD.client_tier;
    NEW.broker_tier := OLD.broker_tier;
    NEW.tier_updated_at := OLD.tier_updated_at;
    NEW.user_type := OLD.user_type;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_trust_guard ON public.profiles;
CREATE TRIGGER profiles_trust_guard BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_guard();

-- vip_clients: block self-elevation of VIP category & financials
CREATE OR REPLACE FUNCTION public.tg_vip_clients_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._caller_is_privileged() THEN
    NEW.vip_category := OLD.vip_category;
    NEW.is_verified := OLD.is_verified;
    NEW.verified_by := OLD.verified_by;
    NEW.verified_at := OLD.verified_at;
    NEW.loyalty_points := OLD.loyalty_points;
    NEW.properties_purchased := OLD.properties_purchased;
    NEW.total_investment_value := OLD.total_investment_value;
    NEW.assigned_relationship_manager := OLD.assigned_relationship_manager;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS vip_clients_guard ON public.vip_clients;
CREATE TRIGGER vip_clients_guard BEFORE UPDATE ON public.vip_clients
FOR EACH ROW EXECUTE FUNCTION public.tg_vip_clients_guard();
