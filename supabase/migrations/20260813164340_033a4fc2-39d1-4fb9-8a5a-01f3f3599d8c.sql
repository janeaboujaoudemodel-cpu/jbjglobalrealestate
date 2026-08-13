-- customer_reviews: lock moderation columns
CREATE OR REPLACE FUNCTION public.customer_reviews_lock_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.loyalty_points_awarded := OLD.loyalty_points_awarded;
  NEW.admin_notes := OLD.admin_notes;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.published_at := OLD.published_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customer_reviews_lock_moderation_trg ON public.customer_reviews;
CREATE TRIGGER customer_reviews_lock_moderation_trg
BEFORE UPDATE ON public.customer_reviews
FOR EACH ROW EXECUTE FUNCTION public.customer_reviews_lock_moderation();

-- portal_listings: lock approval / featured / fee / counters
CREATE OR REPLACE FUNCTION public.portal_listings_lock_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;
  NEW.approval_status := OLD.approval_status;
  NEW.status := OLD.status;
  NEW.is_featured := OLD.is_featured;
  NEW.featured_until := OLD.featured_until;
  NEW.approved_at := OLD.approved_at;
  NEW.approved_by := OLD.approved_by;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.admin_notes := OLD.admin_notes;
  NEW.listing_fee := OLD.listing_fee;
  NEW.contact_mode := OLD.contact_mode;
  NEW.view_count := OLD.view_count;
  NEW.inquiry_count := OLD.inquiry_count;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS portal_listings_lock_approval_trg ON public.portal_listings;
CREATE TRIGGER portal_listings_lock_approval_trg
BEFORE UPDATE ON public.portal_listings
FOR EACH ROW EXECUTE FUNCTION public.portal_listings_lock_approval();

-- rental_listings: lock status and every approval stamp
CREATE OR REPLACE FUNCTION public.rental_listings_lock_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.admin_approved_at := OLD.admin_approved_at;
  NEW.admin_approved_by := OLD.admin_approved_by;
  NEW.assistant_approved_at := OLD.assistant_approved_at;
  NEW.assistant_approved_by := OLD.assistant_approved_by;
  NEW.founder_approved_at := OLD.founder_approved_at;
  NEW.founder_approved_by := OLD.founder_approved_by;
  NEW.leadership_approved_at := OLD.leadership_approved_at;
  NEW.leadership_approved_by := OLD.leadership_approved_by;
  NEW.went_live_at := OLD.went_live_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rental_listings_lock_approval_trg ON public.rental_listings;
CREATE TRIGGER rental_listings_lock_approval_trg
BEFORE UPDATE ON public.rental_listings
FOR EACH ROW EXECUTE FUNCTION public.rental_listings_lock_approval();