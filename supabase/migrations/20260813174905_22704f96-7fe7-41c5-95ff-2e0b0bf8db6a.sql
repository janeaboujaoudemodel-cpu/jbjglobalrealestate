
-- PASS 346 — SELF-APPROVAL LOCK ON SELF-SUBMITTED ROWS
-- Privileged escalation guard: a submitter can never insert an already-approved row.

CREATE OR REPLACE FUNCTION public.lock_broker_bonus_claim_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner') THEN
    RETURN NEW;
  END IF;

  NEW.bonus_status := 'pending';
  NEW.approved_by := NULL;
  NEW.approved_at := NULL;
  NEW.paid_at := NULL;
  NEW.rejection_reason := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_broker_bonus_claim_insert ON public.broker_bonus_claims;
CREATE TRIGGER trg_lock_broker_bonus_claim_insert
BEFORE INSERT ON public.broker_bonus_claims
FOR EACH ROW EXECUTE FUNCTION public.lock_broker_bonus_claim_insert();


CREATE OR REPLACE FUNCTION public.lock_hr_leave_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner')
     OR public.has_role(auth.uid(), 'hr_admin') THEN
    RETURN NEW;
  END IF;

  NEW.status := 'pending'::leave_status;
  NEW.current_stage := 'manager';
  NEW.manager_decision := NULL;
  NEW.manager_decision_at := NULL;
  NEW.manager_notes := NULL;
  NEW.hr_decision := NULL;
  NEW.hr_decision_at := NULL;
  NEW.hr_notes := NULL;
  NEW.owner_decision := NULL;
  NEW.owner_decision_at := NULL;
  NEW.owner_notes := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_hr_leave_request_insert ON public.hr_leave_requests;
CREATE TRIGGER trg_lock_hr_leave_request_insert
BEFORE INSERT ON public.hr_leave_requests
FOR EACH ROW EXECUTE FUNCTION public.lock_hr_leave_request_insert();


CREATE OR REPLACE FUNCTION public.lock_rental_listing_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner')
     OR public.has_role(auth.uid(), 'listing_admin') THEN
    RETURN NEW;
  END IF;

  NEW.status := 'pending';
  NEW.admin_approved_at := NULL;
  NEW.assistant_approved_at := NULL;
  NEW.founder_approved_at := NULL;
  NEW.went_live_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_rental_listing_insert ON public.rental_listings;
CREATE TRIGGER trg_lock_rental_listing_insert
BEFORE INSERT ON public.rental_listings
FOR EACH ROW EXECUTE FUNCTION public.lock_rental_listing_insert();
