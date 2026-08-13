-- Escalation Lock: freeze privileged columns on self-editable tables via SECURITY DEFINER triggers

CREATE OR REPLACE FUNCTION public.broker_subscriptions_lock_privileged()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;
  NEW.tier := OLD.tier;
  NEW.status := OLD.status;
  NEW.price_usd := OLD.price_usd;
  NEW.currency := OLD.currency;
  NEW.ai_credits_limit := OLD.ai_credits_limit;
  NEW.expires_at := OLD.expires_at;
  NEW.starts_at := OLD.starts_at;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.payment_method := OLD.payment_method;
  NEW.payment_reference := OLD.payment_reference;
  NEW.user_role := OLD.user_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_subscriptions_lock_privileged ON public.broker_subscriptions;
CREATE TRIGGER trg_broker_subscriptions_lock_privileged
BEFORE UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.broker_subscriptions_lock_privileged();

CREATE OR REPLACE FUNCTION public.developer_registrations_lock_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.admin_notes := OLD.admin_notes;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developer_registrations_lock_review ON public.developer_registrations;
CREATE TRIGGER trg_developer_registrations_lock_review
BEFORE UPDATE ON public.developer_registrations
FOR EACH ROW EXECUTE FUNCTION public.developer_registrations_lock_review();

CREATE OR REPLACE FUNCTION public.portal_listings_lock_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.approval_status := OLD.approval_status;
  NEW.is_featured := OLD.is_featured;
  NEW.featured_until := OLD.featured_until;
  NEW.listing_fee := OLD.listing_fee;
  NEW.contact_mode := OLD.contact_mode;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_listings_lock_approval ON public.portal_listings;
CREATE TRIGGER trg_portal_listings_lock_approval
BEFORE UPDATE ON public.portal_listings
FOR EACH ROW EXECUTE FUNCTION public.portal_listings_lock_approval();