
CREATE OR REPLACE FUNCTION public.prevent_referral_partner_financial_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean := false;
BEGIN
  BEGIN
    is_privileged := public.has_role(auth.uid(), 'admin'::app_role)
                  OR public.has_role(auth.uid(), 'owner'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_privileged := false;
  END;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF NEW.commission_rate      IS DISTINCT FROM OLD.commission_rate
  OR NEW.total_earnings_aed   IS DISTINCT FROM OLD.total_earnings_aed
  OR NEW.total_conversions    IS DISTINCT FROM OLD.total_conversions
  OR NEW.total_referrals      IS DISTINCT FROM OLD.total_referrals
  OR NEW.status               IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Referral partners cannot modify commission_rate, total_earnings_aed, total_conversions, total_referrals, or status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_referral_partner_financial_self_update ON public.referral_partners;
CREATE TRIGGER trg_prevent_referral_partner_financial_self_update
BEFORE UPDATE ON public.referral_partners
FOR EACH ROW
EXECUTE FUNCTION public.prevent_referral_partner_financial_self_update();
