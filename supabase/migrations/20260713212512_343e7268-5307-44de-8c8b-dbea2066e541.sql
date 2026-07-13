
-- 1) broker_subscriptions: block self-upgrade of billing/tier fields
CREATE OR REPLACE FUNCTION public.prevent_broker_subscription_self_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid() THEN
    IF NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.price_usd IS DISTINCT FROM OLD.price_usd
       OR NEW.ai_credits_limit IS DISTINCT FROM OLD.ai_credits_limit
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
       OR NEW.started_at IS DISTINCT FROM OLD.started_at
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
    THEN
      RAISE EXCEPTION 'Not allowed to modify billing/tier fields on your own subscription';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_broker_subscription_self_upgrade ON public.broker_subscriptions;
CREATE TRIGGER trg_prevent_broker_subscription_self_upgrade
BEFORE UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.prevent_broker_subscription_self_upgrade();

-- 2) portal_listings: block self-approve/feature
CREATE OR REPLACE FUNCTION public.prevent_portal_listing_self_approve()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid() THEN
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
    THEN
      RAISE EXCEPTION 'Not allowed to change approval/status/featured on your own listing';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_portal_listing_self_approve ON public.portal_listings;
CREATE TRIGGER trg_prevent_portal_listing_self_approve
BEFORE UPDATE ON public.portal_listings
FOR EACH ROW EXECUTE FUNCTION public.prevent_portal_listing_self_approve();

-- 3) referral_partners: block self-edit of financial/approval
CREATE OR REPLACE FUNCTION public.prevent_referral_partner_self_edit_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid() THEN
    IF NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
       OR NEW.total_earnings_aed IS DISTINCT FROM OLD.total_earnings_aed
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    THEN
      RAISE EXCEPTION 'Not allowed to change financial or approval fields on your own referral partner record';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_referral_partner_self_edit_financials ON public.referral_partners;
CREATE TRIGGER trg_prevent_referral_partner_self_edit_financials
BEFORE UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.prevent_referral_partner_self_edit_financials();

-- 4) rental_listings: block self-approve
CREATE OR REPLACE FUNCTION public.prevent_rental_listing_self_approve()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.admin_approved_at IS DISTINCT FROM OLD.admin_approved_at
       OR NEW.assistant_approved_at IS DISTINCT FROM OLD.assistant_approved_at
       OR NEW.leadership_approved_at IS DISTINCT FROM OLD.leadership_approved_at
       OR NEW.founder_approved_at IS DISTINCT FROM OLD.founder_approved_at
       OR NEW.went_live_at IS DISTINCT FROM OLD.went_live_at
    THEN
      RAISE EXCEPTION 'Not allowed to change approval/status fields on your own rental listing';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_rental_listing_self_approve ON public.rental_listings;
CREATE TRIGGER trg_prevent_rental_listing_self_approve
BEFORE UPDATE ON public.rental_listings
FOR EACH ROW EXECUTE FUNCTION public.prevent_rental_listing_self_approve();
