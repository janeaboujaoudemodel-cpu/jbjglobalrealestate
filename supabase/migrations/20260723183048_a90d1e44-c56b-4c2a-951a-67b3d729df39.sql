
-- Lock privileged columns on broker_profiles from self-updates
CREATE OR REPLACE FUNCTION public.broker_profiles_prevent_privileged_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean := false;
BEGIN
  -- Service role and owners/admins are allowed to change privileged fields
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT public.has_role(auth.uid(), 'admin') INTO is_privileged;
  EXCEPTION WHEN OTHERS THEN
    is_privileged := false;
  END;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  -- Force privileged fields back to their prior values for self-updates
  NEW.verification_status := OLD.verification_status;
  NEW.current_tier        := OLD.current_tier;
  NEW.total_points        := OLD.total_points;
  NEW.performance_rating  := OLD.performance_rating;
  NEW.custom_title        := OLD.custom_title;
  NEW.custom_label        := OLD.custom_label;
  NEW.probation_end       := OLD.probation_end;
  NEW.probation_skipped   := OLD.probation_skipped;
  NEW.rera_expiry_date    := OLD.rera_expiry_date;
  NEW.id_expiry_date      := OLD.id_expiry_date;
  NEW.broker_type         := OLD.broker_type;
  NEW.is_active           := OLD.is_active;
  NEW.user_id             := OLD.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broker_profiles_lock_privileged_fields ON public.broker_profiles;
CREATE TRIGGER broker_profiles_lock_privileged_fields
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW
EXECUTE FUNCTION public.broker_profiles_prevent_privileged_self_update();


-- Lock privileged columns on user_interest_profile from self VIP escalation
CREATE OR REPLACE FUNCTION public.user_interest_profile_prevent_privileged_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean := false;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT public.has_role(auth.uid(), 'admin') INTO is_privileged;
  EXCEPTION WHEN OTHERS THEN
    is_privileged := false;
  END;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  NEW.vip_tier          := OLD.vip_tier;
  NEW.vip_override      := OLD.vip_override;
  NEW.confidence_score  := OLD.confidence_score;
  NEW.revenue_potential := OLD.revenue_potential;
  NEW.engagement_score  := OLD.engagement_score;
  NEW.user_id           := OLD.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_interest_profile_lock_privileged_fields ON public.user_interest_profile;
CREATE TRIGGER user_interest_profile_lock_privileged_fields
BEFORE UPDATE ON public.user_interest_profile
FOR EACH ROW
EXECUTE FUNCTION public.user_interest_profile_prevent_privileged_self_update();
