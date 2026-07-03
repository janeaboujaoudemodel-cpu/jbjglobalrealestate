
-- 1) profiles — block self escalation of verification / tier fields
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.is_verified       IS DISTINCT FROM OLD.is_verified
  OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
  OR NEW.client_tier       IS DISTINCT FROM OLD.client_tier
  OR NEW.broker_tier       IS DISTINCT FROM OLD.broker_tier THEN
    RAISE EXCEPTION 'Not permitted to modify verification or tier fields';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2) referral_partners — block self-approval and commission/earnings edits
CREATE OR REPLACE FUNCTION public.prevent_referral_partner_privilege_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status              IS DISTINCT FROM OLD.status
  OR NEW.commission_rate     IS DISTINCT FROM OLD.commission_rate
  OR NEW.total_earnings_aed  IS DISTINCT FROM OLD.total_earnings_aed THEN
    RAISE EXCEPTION 'Not permitted to modify status, commission_rate, or total_earnings_aed';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_prevent_referral_partner_privilege_escalation ON public.referral_partners;
CREATE TRIGGER trg_prevent_referral_partner_privilege_escalation
BEFORE UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.prevent_referral_partner_privilege_escalation();

-- 3) vip_clients — block self VIP tier / loyalty / verification / investment edits
CREATE OR REPLACE FUNCTION public.prevent_vip_client_privilege_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.vip_category            IS DISTINCT FROM OLD.vip_category
  OR NEW.loyalty_points          IS DISTINCT FROM OLD.loyalty_points
  OR NEW.is_verified             IS DISTINCT FROM OLD.is_verified
  OR NEW.total_investment_value  IS DISTINCT FROM OLD.total_investment_value THEN
    RAISE EXCEPTION 'Not permitted to modify vip_category, loyalty_points, is_verified, or total_investment_value';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_prevent_vip_client_privilege_escalation ON public.vip_clients;
CREATE TRIGGER trg_prevent_vip_client_privilege_escalation
BEFORE UPDATE ON public.vip_clients
FOR EACH ROW EXECUTE FUNCTION public.prevent_vip_client_privilege_escalation();
