
CREATE OR REPLACE FUNCTION public.is_admin_or_owner_caller()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','owner')
    );
$$;

CREATE OR REPLACE FUNCTION public.broker_profiles_lock_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin_or_owner_caller() THEN RETURN NEW; END IF;
  NEW.current_tier        := OLD.current_tier;
  NEW.total_points        := OLD.total_points;
  NEW.verification_status := OLD.verification_status;
  NEW.face_verified       := OLD.face_verified;
  NEW.performance_rating  := OLD.performance_rating;
  NEW.custom_title        := OLD.custom_title;
  NEW.custom_label        := OLD.custom_label;
  NEW.broker_type         := OLD.broker_type;
  NEW.rera_expiry_date    := OLD.rera_expiry_date;
  NEW.id_expiry_date      := OLD.id_expiry_date;
  NEW.probation_end       := OLD.probation_end;
  NEW.probation_skipped   := OLD.probation_skipped;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_broker_profiles_lock_privileged ON public.broker_profiles;
CREATE TRIGGER trg_broker_profiles_lock_privileged
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.broker_profiles_lock_privileged_fields();

CREATE OR REPLACE FUNCTION public.developer_reps_lock_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin_or_owner_caller() THEN RETURN NEW; END IF;
  NEW.status        := OLD.status;
  NEW.developer_id  := OLD.developer_id;
  NEW.authorized_by := OLD.authorized_by;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_developer_reps_lock_privileged ON public.developer_representatives;
CREATE TRIGGER trg_developer_reps_lock_privileged
BEFORE UPDATE ON public.developer_representatives
FOR EACH ROW EXECUTE FUNCTION public.developer_reps_lock_privileged_fields();

CREATE OR REPLACE FUNCTION public.hr_candidates_lock_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin_or_owner_caller() THEN RETURN NEW; END IF;
  NEW.status         := OLD.status;
  NEW.ai_score       := OLD.ai_score;
  NEW.ai_ranking     := OLD.ai_ranking;
  NEW.final_decision := OLD.final_decision;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_hr_candidates_lock_privileged ON public.hr_candidates;
CREATE TRIGGER trg_hr_candidates_lock_privileged
BEFORE UPDATE ON public.hr_candidates
FOR EACH ROW EXECUTE FUNCTION public.hr_candidates_lock_privileged_fields();

CREATE OR REPLACE FUNCTION public.hr_applications_lock_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin_or_owner_caller() THEN RETURN NEW; END IF;
  NEW.status           := OLD.status;
  NEW.ai_ranking       := OLD.ai_ranking;
  NEW.ai_summary       := OLD.ai_summary;
  NEW.skills           := OLD.skills;
  NEW.experience_years := OLD.experience_years;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_hr_applications_lock_privileged ON public.hr_applications;
CREATE TRIGGER trg_hr_applications_lock_privileged
BEFORE UPDATE ON public.hr_applications
FOR EACH ROW EXECUTE FUNCTION public.hr_applications_lock_privileged_fields();

CREATE OR REPLACE FUNCTION public.referral_partners_lock_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin_or_owner_caller() THEN RETURN NEW; END IF;
  NEW.commission_rate    := OLD.commission_rate;
  NEW.status             := OLD.status;
  NEW.total_earnings_aed := OLD.total_earnings_aed;
  NEW.total_referrals    := OLD.total_referrals;
  NEW.total_conversions  := OLD.total_conversions;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_referral_partners_lock_privileged ON public.referral_partners;
CREATE TRIGGER trg_referral_partners_lock_privileged
BEFORE UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.referral_partners_lock_privileged_fields();
