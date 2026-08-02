-- Developer registrations: allow self-service draft <-> submitted transitions
CREATE OR REPLACE FUNCTION public.developer_registrations_block_privileged_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'user_id is immutable';
  END IF;
  IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Only owner/admin can modify reviewer or admin notes';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- applicants may only save a draft or submit for review
    IF NEW.status NOT IN ('draft', 'submitted') THEN
      RAISE EXCEPTION 'Only owner/admin can set this registration status';
    END IF;
    -- an already approved application cannot be reopened by the applicant
    IF OLD.status IN ('approved', 'under_review') THEN
      RAISE EXCEPTION 'Only owner/admin can modify a registration under review or approved';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Broker verifications: allow owners of the row to resubmit as pending only
DROP POLICY IF EXISTS "Users update own pending verification" ON public.broker_verifications;
CREATE POLICY "Users update own pending verification"
ON public.broker_verifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status <> 'approved')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE OR REPLACE FUNCTION public.broker_verifications_block_privileged_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'user_id is immutable';
  END IF;
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Only owner/admin can set verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_verifications_block_privileged_self_update ON public.broker_verifications;
CREATE TRIGGER trg_broker_verifications_block_privileged_self_update
BEFORE UPDATE ON public.broker_verifications
FOR EACH ROW EXECUTE FUNCTION public.broker_verifications_block_privileged_self_update();