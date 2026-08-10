CREATE OR REPLACE FUNCTION public.lock_rental_listing_insert_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_staff boolean := false;
BEGIN
  caller_is_staff :=
    current_setting('role', true) = 'service_role'
    OR (auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'owner'::public.app_role)
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_owner_user()
    ));

  IF NOT caller_is_staff THEN
    NEW.status := 'pending_review';
    NEW.admin_approved_at := NULL;
    NEW.admin_approved_by := NULL;
    NEW.assistant_approved_at := NULL;
    NEW.assistant_approved_by := NULL;
    NEW.founder_approved_at := NULL;
    NEW.founder_approved_by := NULL;
    NEW.leadership_approved_at := NULL;
    NEW.leadership_approved_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rental_listings_lock_insert_approval ON public.rental_listings;
CREATE TRIGGER trg_rental_listings_lock_insert_approval
BEFORE INSERT ON public.rental_listings
FOR EACH ROW
EXECUTE FUNCTION public.lock_rental_listing_insert_approval_fields();

CREATE OR REPLACE FUNCTION public.lock_seller_listing_insert_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_staff boolean := false;
BEGIN
  caller_is_staff :=
    current_setting('role', true) = 'service_role'
    OR (auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'owner'::public.app_role)
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_owner_user()
    ));

  IF NOT caller_is_staff THEN
    NEW.status := 'draft';
    NEW.approval_status := 'pending';
    NEW.admin_approved_at := NULL;
    NEW.admin_approved_by := NULL;
    NEW.assistant_approved_at := NULL;
    NEW.assistant_approved_by := NULL;
    NEW.founder_approved_at := NULL;
    NEW.founder_approved_by := NULL;
    NEW.leadership_approved_at := NULL;
    NEW.leadership_approved_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seller_listings_lock_insert_approval ON public.seller_listings;
CREATE TRIGGER trg_seller_listings_lock_insert_approval
BEFORE INSERT ON public.seller_listings
FOR EACH ROW
EXECUTE FUNCTION public.lock_seller_listing_insert_approval_fields();