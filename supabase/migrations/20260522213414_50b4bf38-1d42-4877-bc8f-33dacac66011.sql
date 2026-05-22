
-- Guard function: locks approved logos against automated overwrites
CREATE OR REPLACE FUNCTION public.protect_approved_developer_logos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean := false;
  bypass   text;
BEGIN
  -- Only enforce when the row was already approved and someone tries to mutate
  -- the logo fields (logo_url or logo_status).
  IF OLD.logo_status IS DISTINCT FROM 'approved' THEN
    RETURN NEW;
  END IF;

  IF NEW.logo_url IS NOT DISTINCT FROM OLD.logo_url
     AND NEW.logo_status IS NOT DISTINCT FROM OLD.logo_status THEN
    RETURN NEW;
  END IF;

  -- Owner is always allowed (manual UI edits).
  BEGIN
    is_owner := public.has_role(auth.uid(), 'owner'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_owner := false;
  END;

  IF is_owner THEN
    RETURN NEW;
  END IF;

  -- Explicit one-shot bypass for trusted server contexts.
  BEGIN
    bypass := current_setting('app.allow_logo_overwrite', true);
  EXCEPTION WHEN OTHERS THEN
    bypass := NULL;
  END;

  IF bypass = 'true' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'developer logo is locked: % is approved and can only be changed by the owner',
    OLD.name
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_approved_logos ON public.developers;
CREATE TRIGGER trg_protect_approved_logos
BEFORE UPDATE OF logo_url, logo_status ON public.developers
FOR EACH ROW
EXECUTE FUNCTION public.protect_approved_developer_logos();
