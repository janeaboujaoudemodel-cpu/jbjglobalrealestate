
CREATE OR REPLACE FUNCTION public.prevent_uip_vip_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean := false;
  jwt_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  -- service_role bypass
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- admin / owner bypass
  BEGIN
    is_privileged := public.has_role(auth.uid(), 'admin'::public.app_role)
                  OR public.has_role(auth.uid(), 'owner'::public.app_role);
  EXCEPTION WHEN OTHERS THEN
    is_privileged := false;
  END;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  -- Non-privileged: revert protected columns to their previous values
  NEW.vip_tier := OLD.vip_tier;
  NEW.vip_override := OLD.vip_override;
  NEW.vip_override_by := OLD.vip_override_by;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_uip_vip_self_update ON public.user_interest_profile;
CREATE TRIGGER trg_prevent_uip_vip_self_update
BEFORE UPDATE ON public.user_interest_profile
FOR EACH ROW
EXECUTE FUNCTION public.prevent_uip_vip_self_update();
