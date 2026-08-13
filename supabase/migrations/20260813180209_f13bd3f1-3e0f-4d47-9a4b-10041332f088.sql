-- Escalation Lock: seller_listings approval columns + vault verification columns
CREATE OR REPLACE FUNCTION public.seller_listings_lock_approval_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privileged boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / server-side jobs
  END IF;
  privileged := public.has_role(auth.uid(), 'admin')
             OR public.has_role(auth.uid(), 'owner')
             OR public.has_role(auth.uid(), 'listing_admin');
  IF privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.approval_status := 'pending';
    NEW.admin_approved_at := NULL;
    NEW.admin_approved_by := NULL;
    NEW.assistant_approved_at := NULL;
    NEW.assistant_approved_by := NULL;
    NEW.founder_approved_at := NULL;
    NEW.founder_approved_by := NULL;
    NEW.leadership_approved_at := NULL;
    NEW.leadership_approved_by := NULL;
    NEW.ai_score := NULL;
    NEW.ai_score_data := NULL;
  ELSE
    NEW.status := OLD.status;
    NEW.approval_status := OLD.approval_status;
    NEW.admin_approved_at := OLD.admin_approved_at;
    NEW.admin_approved_by := OLD.admin_approved_by;
    NEW.assistant_approved_at := OLD.assistant_approved_at;
    NEW.assistant_approved_by := OLD.assistant_approved_by;
    NEW.founder_approved_at := OLD.founder_approved_at;
    NEW.founder_approved_by := OLD.founder_approved_by;
    NEW.leadership_approved_at := OLD.leadership_approved_at;
    NEW.leadership_approved_by := OLD.leadership_approved_by;
    NEW.ai_score := OLD.ai_score;
    NEW.ai_score_data := OLD.ai_score_data;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_listings_lock_approval_trg ON public.seller_listings;
CREATE TRIGGER seller_listings_lock_approval_trg
BEFORE INSERT OR UPDATE ON public.seller_listings
FOR EACH ROW EXECUTE FUNCTION public.seller_listings_lock_approval_columns();

CREATE OR REPLACE FUNCTION public.vault_documents_lock_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privileged boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  privileged := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner');
  IF privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verified := false;
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
  ELSE
    NEW.verified := OLD.verified;
    NEW.verified_by := OLD.verified_by;
    NEW.verified_at := OLD.verified_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vault_documents_lock_verification_trg ON public.vault_documents;
CREATE TRIGGER vault_documents_lock_verification_trg
BEFORE INSERT OR UPDATE ON public.vault_documents
FOR EACH ROW EXECUTE FUNCTION public.vault_documents_lock_verification();

CREATE OR REPLACE FUNCTION public.vault_properties_lock_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privileged boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  privileged := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner');
  IF privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verified := false;
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.status := COALESCE(NULLIF(NEW.status, ''), 'pending');
    IF NEW.status NOT IN ('pending', 'draft') THEN
      NEW.status := 'pending';
    END IF;
  ELSE
    NEW.verified := OLD.verified;
    NEW.verified_by := OLD.verified_by;
    NEW.verified_at := OLD.verified_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vault_properties_lock_verification_trg ON public.vault_properties;
CREATE TRIGGER vault_properties_lock_verification_trg
BEFORE INSERT OR UPDATE ON public.vault_properties
FOR EACH ROW EXECUTE FUNCTION public.vault_properties_lock_verification();