CREATE OR REPLACE FUNCTION public.rental_listings_lock_privileged_update_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_privileged boolean := false;
BEGIN
  caller_is_privileged :=
    current_setting('role', true) = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND (
        public.has_role(auth.uid(), 'owner'::public.app_role)
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_owner_user()
        OR public.is_listing_admin(auth.uid())
      )
    );

  IF NOT caller_is_privileged THEN
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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rental_listings_lock_privileged_update ON public.rental_listings;
CREATE TRIGGER trg_rental_listings_lock_privileged_update
BEFORE UPDATE ON public.rental_listings
FOR EACH ROW
EXECUTE FUNCTION public.rental_listings_lock_privileged_update_fields();

CREATE OR REPLACE FUNCTION public.seller_listings_lock_privileged_update_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_privileged boolean := false;
BEGIN
  caller_is_privileged :=
    current_setting('role', true) = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND (
        public.has_role(auth.uid(), 'owner'::public.app_role)
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_owner_user()
        OR public.is_listing_admin(auth.uid())
      )
    );

  IF NOT caller_is_privileged THEN
    NEW.approval_status := OLD.approval_status;
    NEW.admin_approved_at := OLD.admin_approved_at;
    NEW.admin_approved_by := OLD.admin_approved_by;
    NEW.assistant_approved_at := OLD.assistant_approved_at;
    NEW.assistant_approved_by := OLD.assistant_approved_by;
    NEW.founder_approved_at := OLD.founder_approved_at;
    NEW.founder_approved_by := OLD.founder_approved_by;
    NEW.leadership_approved_at := OLD.leadership_approved_at;
    NEW.leadership_approved_by := OLD.leadership_approved_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.review_notes := OLD.review_notes;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.went_live_at := OLD.went_live_at;
    NEW.ai_score := OLD.ai_score;
    NEW.ai_score_data := OLD.ai_score_data;
    NEW.contact_mode := OLD.contact_mode;
    NEW.listing_fee := OLD.listing_fee;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seller_listings_lock_privileged_update ON public.seller_listings;
CREATE TRIGGER trg_seller_listings_lock_privileged_update
BEFORE UPDATE ON public.seller_listings
FOR EACH ROW
EXECUTE FUNCTION public.seller_listings_lock_privileged_update_fields();

CREATE OR REPLACE FUNCTION public.vault_documents_lock_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    current_setting('role', true) = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND (
        public.has_role(auth.uid(), 'owner'::public.app_role)
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_owner_user()
      )
    )
  ) THEN
    NEW.verified := OLD.verified;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vault_documents_lock_verification ON public.vault_documents;
CREATE TRIGGER trg_vault_documents_lock_verification
BEFORE UPDATE ON public.vault_documents
FOR EACH ROW
EXECUTE FUNCTION public.vault_documents_lock_verification_fields();

CREATE OR REPLACE FUNCTION public.vault_properties_lock_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    current_setting('role', true) = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND (
        public.has_role(auth.uid(), 'owner'::public.app_role)
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_owner_user()
      )
    )
  ) THEN
    NEW.verified := OLD.verified;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vault_properties_lock_verification ON public.vault_properties;
CREATE TRIGGER trg_vault_properties_lock_verification
BEFORE UPDATE ON public.vault_properties
FOR EACH ROW
EXECUTE FUNCTION public.vault_properties_lock_verification_fields();