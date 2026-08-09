-- 1. Profiles: lock privileged trust fields on self-service updates
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_privileged boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW; -- service role / server-side jobs
  END IF;
  BEGIN
    v_privileged := public.has_role(v_uid, 'admin'::app_role)
                 OR public.has_role(v_uid, 'owner'::app_role);
  EXCEPTION WHEN OTHERS THEN
    v_privileged := false;
  END;
  IF v_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.is_verified          := OLD.is_verified;
    NEW.verification_status  := OLD.verification_status;
    NEW.broker_tier          := OLD.broker_tier;
    NEW.client_tier          := OLD.client_tier;
    NEW.first_deal_verified  := OLD.first_deal_verified;
    NEW.login_streak         := OLD.login_streak;
  ELSE
    NEW.is_verified          := false;
    NEW.verification_status  := 'pending';
    NEW.broker_tier          := NULL;
    NEW.client_tier          := NULL;
    NEW.first_deal_verified  := false;
    NEW.login_streak         := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged_fields_trg ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_fields_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileged_fields();

-- 2. Broker profiles: self-updates limited to contact/bio fields
CREATE OR REPLACE FUNCTION public.broker_profiles_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_privileged boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;
  BEGIN
    v_privileged := public.has_role(v_uid, 'admin'::app_role)
                 OR public.has_role(v_uid, 'owner'::app_role);
  EXCEPTION WHEN OTHERS THEN
    v_privileged := false;
  END;
  IF v_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.verification_status   := OLD.verification_status;
    NEW.current_tier          := OLD.current_tier;
    NEW.total_points          := OLD.total_points;
    NEW.face_verified         := OLD.face_verified;
    NEW.performance_rating    := OLD.performance_rating;
    NEW.probation_start_date  := OLD.probation_start_date;
    NEW.probation_end_date    := OLD.probation_end_date;
  ELSE
    NEW.verification_status   := 'pending';
    NEW.face_verified         := false;
    NEW.total_points          := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broker_profiles_guard_privileged_fields_trg ON public.broker_profiles;
CREATE TRIGGER broker_profiles_guard_privileged_fields_trg
BEFORE INSERT OR UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.broker_profiles_guard_privileged_fields();

-- 3. Arada: replace the wrong-brand logo with the official Arada mark
DO $$
BEGIN
  PERFORM set_config('app.allow_logo_overwrite', 'true', true);
  UPDATE public.developers SET logo_locked = false WHERE id = '8228696c-fb87-4d92-99b9-eb68cb51949b';
  UPDATE public.developers
     SET logo_url = 'https://aradawebcontent.blob.core.windows.net/arada-com/2022/06/arada-logo.svg',
         logo_url_processed = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v1/arada-properties.svg',
         logo_source = 'https://www.arada.com/en/',
         logo_verified = true,
         logo_verified_at = now(),
         logo_locked = true
   WHERE id = '8228696c-fb87-4d92-99b9-eb68cb51949b';
END $$;