CREATE OR REPLACE FUNCTION public.tg_broker_requests_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IN ('approved','rejected','resolved','cancelled') AND OLD.status <> NEW.status AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at = now();
    NEW.resolved_by = COALESCE(NEW.resolved_by, auth.uid());
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.touch_owner_ui_overrides()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;