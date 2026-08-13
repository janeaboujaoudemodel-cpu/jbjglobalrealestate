-- Attach existing approval-lock triggers (functions existed but were never wired)
DROP TRIGGER IF EXISTS trg_rental_listings_lock_privileged ON public.rental_listings;
CREATE TRIGGER trg_rental_listings_lock_privileged
BEFORE UPDATE ON public.rental_listings
FOR EACH ROW EXECUTE FUNCTION public.rental_listings_lock_privileged_update_fields();

DROP TRIGGER IF EXISTS trg_vault_properties_lock_verification ON public.vault_properties;
CREATE TRIGGER trg_vault_properties_lock_verification
BEFORE UPDATE ON public.vault_properties
FOR EACH ROW EXECUTE FUNCTION public.vault_properties_lock_verification_fields();

-- Developer project submissions: freeze review/approval columns for non-staff
CREATE OR REPLACE FUNCTION public.developer_project_submissions_lock_review_fields()
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
      )
    )
  ) THEN
    NEW.status := OLD.status;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.is_premium := OLD.is_premium;
    NEW.premium_flagged := OLD.premium_flagged;
    NEW.admin_notes := OLD.admin_notes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developer_project_submissions_lock_review ON public.developer_project_submissions;
CREATE TRIGGER trg_developer_project_submissions_lock_review
BEFORE UPDATE ON public.developer_project_submissions
FOR EACH ROW EXECUTE FUNCTION public.developer_project_submissions_lock_review_fields();