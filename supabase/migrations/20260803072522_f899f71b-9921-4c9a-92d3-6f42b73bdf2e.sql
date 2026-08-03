-- Prevent self-granting of privileged status fields on profiles and broker_profiles.
CREATE OR REPLACE FUNCTION public.guard_profiles_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Staff/admin/service contexts may change anything.
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner')
     OR public.has_role(auth.uid(), 'support_ops') THEN
    RETURN NEW;
  END IF;

  NEW.is_verified            := OLD.is_verified;
  NEW.verified_at            := OLD.verified_at;
  NEW.verification_status    := OLD.verification_status;
  NEW.broker_tier            := OLD.broker_tier;
  NEW.client_tier            := OLD.client_tier;
  NEW.tier_updated_at        := OLD.tier_updated_at;
  NEW.first_deal_verified    := OLD.first_deal_verified;
  NEW.first_deal_verified_at := OLD.first_deal_verified_at;
  NEW.picked_role            := OLD.picked_role;
  NEW.picked_role_at         := OLD.picked_role_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profiles_privileged_fields ON public.profiles;
CREATE TRIGGER guard_profiles_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_privileged_fields();

CREATE OR REPLACE FUNCTION public.guard_broker_profiles_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner')
     OR public.has_role(auth.uid(), 'support_ops') THEN
    RETURN NEW;
  END IF;

  NEW.verification_status       := OLD.verification_status;
  NEW.face_verified             := OLD.face_verified;
  NEW.face_verification_status  := OLD.face_verification_status;
  NEW.current_tier              := OLD.current_tier;
  NEW.total_points              := OLD.total_points;
  NEW.tier_updated_at           := OLD.tier_updated_at;
  NEW.performance_rating        := OLD.performance_rating;
  NEW.probation_start           := OLD.probation_start;
  NEW.probation_end             := OLD.probation_end;
  NEW.probation_months          := OLD.probation_months;
  NEW.probation_skipped         := OLD.probation_skipped;
  NEW.broker_type               := OLD.broker_type;
  NEW.custom_label              := OLD.custom_label;
  NEW.custom_title              := OLD.custom_title;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_broker_profiles_privileged_fields ON public.broker_profiles;
CREATE TRIGGER guard_broker_profiles_privileged_fields
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_broker_profiles_privileged_fields();