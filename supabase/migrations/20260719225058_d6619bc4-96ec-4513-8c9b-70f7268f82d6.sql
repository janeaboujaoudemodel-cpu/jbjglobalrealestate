CREATE OR REPLACE FUNCTION public.enforce_developer_logo_before_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_logo text;
BEGIN
  IF NEW.is_published IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  -- Existing visible legacy rows may be repaired from NULL developer_id to a
  -- matched developer without republishing. Keep the lock for initial publish
  -- and for changing an already-linked published project to another developer.
  IF TG_OP = 'UPDATE'
     AND OLD.is_published IS TRUE
     AND OLD.developer_id IS NULL
     AND NEW.developer_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.developer_id IS NULL THEN
    RAISE EXCEPTION 'Cannot publish project "%": no developer linked (locked rule)', NEW.name
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT logo_url INTO v_logo FROM public.developers WHERE id = NEW.developer_id;
  IF v_logo IS NULL OR length(btrim(v_logo)) = 0 THEN
    RAISE EXCEPTION 'Cannot publish project "%": linked developer has no logo (locked rule). Upload a developer logo first.', NEW.name
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;