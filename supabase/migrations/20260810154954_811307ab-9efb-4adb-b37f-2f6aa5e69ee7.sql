CREATE OR REPLACE FUNCTION public.jbj_is_privileged_actor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','owner')
  );
$$;

-- 1) broker_profiles: only contact-ish fields are self-editable
CREATE OR REPLACE FUNCTION public.broker_profiles_lock_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.jbj_is_privileged_actor() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.verification_status      := OLD.verification_status;
  NEW.face_verified            := OLD.face_verified;
  NEW.face_verification_status := OLD.face_verification_status;
  NEW.current_tier             := OLD.current_tier;
  NEW.tier_updated_at          := OLD.tier_updated_at;
  NEW.total_points             := OLD.total_points;
  NEW.performance_rating       := OLD.performance_rating;
  NEW.broker_type              := OLD.broker_type;
  NEW.probation_start          := OLD.probation_start;
  NEW.probation_end            := OLD.probation_end;
  NEW.probation_months         := OLD.probation_months;
  NEW.probation_skipped        := OLD.probation_skipped;
  NEW.rera_expiry_date         := OLD.rera_expiry_date;
  NEW.id_expiry_date           := OLD.id_expiry_date;
  NEW.custom_label             := OLD.custom_label;
  NEW.custom_title             := OLD.custom_title;
  NEW.user_id                  := OLD.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_profiles_lock_privileged_columns ON public.broker_profiles;
CREATE TRIGGER trg_broker_profiles_lock_privileged_columns
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.broker_profiles_lock_privileged_columns();

-- 2) developer_registrations: status/review fields are admin-only
CREATE OR REPLACE FUNCTION public.developer_registrations_lock_review_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.jbj_is_privileged_actor() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.status      := OLD.status;
  NEW.admin_notes := OLD.admin_notes;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.user_id     := OLD.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developer_registrations_lock_review_columns ON public.developer_registrations;
CREATE TRIGGER trg_developer_registrations_lock_review_columns
BEFORE UPDATE ON public.developer_registrations
FOR EACH ROW EXECUTE FUNCTION public.developer_registrations_lock_review_columns();

-- 3) developer_representatives: authorization fields are admin-only
CREATE OR REPLACE FUNCTION public.developer_representatives_lock_auth_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.jbj_is_privileged_actor() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.status               := OLD.status;
  NEW.authorized_by        := OLD.authorized_by;
  NEW.authorized_at        := OLD.authorized_at;
  NEW.suspended_at         := OLD.suspended_at;
  NEW.auto_approve_uploads := OLD.auto_approve_uploads;
  NEW.developer_id         := OLD.developer_id;
  NEW.current_developer_id := OLD.current_developer_id;
  NEW.is_global_broker     := OLD.is_global_broker;
  NEW.user_id              := OLD.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developer_representatives_lock_auth_columns ON public.developer_representatives;
CREATE TRIGGER trg_developer_representatives_lock_auth_columns
BEFORE UPDATE ON public.developer_representatives
FOR EACH ROW EXECUTE FUNCTION public.developer_representatives_lock_auth_columns();