-- Add show_sale_status flag and require developer logo before publishing
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS show_sale_status boolean NOT NULL DEFAULT false;

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

DROP TRIGGER IF EXISTS trg_enforce_developer_logo_before_publish ON public.projects;
CREATE TRIGGER trg_enforce_developer_logo_before_publish
  BEFORE INSERT OR UPDATE OF is_published, developer_id ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_developer_logo_before_publish();

-- Auto-unpublish projects whose developer loses their logo
CREATE OR REPLACE FUNCTION public.auto_unpublish_projects_on_logo_clear()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE')
     AND (OLD.logo_url IS NOT NULL AND length(btrim(OLD.logo_url)) > 0)
     AND (NEW.logo_url IS NULL OR length(btrim(NEW.logo_url)) = 0) THEN
    UPDATE public.projects
       SET is_published = false
     WHERE developer_id = NEW.id AND is_published = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_unpublish_projects_on_logo_clear ON public.developers;
CREATE TRIGGER trg_auto_unpublish_projects_on_logo_clear
  AFTER UPDATE OF logo_url ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_unpublish_projects_on_logo_clear();