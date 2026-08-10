-- Lock privileged profile columns against self-escalation.
CREATE OR REPLACE FUNCTION public.profiles_lock_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  -- Service role / internal jobs and admins/owners may change everything.
  is_privileged := (auth.uid() IS NULL)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  -- Any other caller (i.e. the user editing their own row) cannot touch
  -- verification, tiers, deal verification or account type.
  NEW.is_verified            := OLD.is_verified;
  NEW.verification_status    := OLD.verification_status;
  NEW.verified_at            := OLD.verified_at;
  NEW.broker_tier            := OLD.broker_tier;
  NEW.client_tier            := OLD.client_tier;
  NEW.tier_updated_at        := OLD.tier_updated_at;
  NEW.user_type              := OLD.user_type;
  NEW.picked_role            := OLD.picked_role;
  NEW.picked_role_at         := OLD.picked_role_at;
  NEW.first_deal_verified    := OLD.first_deal_verified;
  NEW.first_deal_verified_at := OLD.first_deal_verified_at;
  NEW.phone_verified         := OLD.phone_verified;
  NEW.login_streak           := OLD.login_streak;
  NEW.total_login_days       := OLD.total_login_days;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_privileged_columns_trg ON public.profiles;
CREATE TRIGGER profiles_lock_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_lock_privileged_columns();