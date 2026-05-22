
-- No-photo → no-publish lock
CREATE OR REPLACE FUNCTION public.project_has_photo(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id
      AND (
        (p.cover_image_url IS NOT NULL AND length(btrim(p.cover_image_url)) > 0)
        OR (p.card_image_url IS NOT NULL AND length(btrim(p.card_image_url)) > 0)
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.project_images pi WHERE pi.project_id = _project_id LIMIT 1
  );
$$;

CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON public.project_images(project_id);

-- Trigger: block publishing projects with no photo
CREATE OR REPLACE FUNCTION public.enforce_no_publish_without_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_cover boolean;
  has_card  boolean;
  has_gallery boolean;
BEGIN
  IF NEW.is_published IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  has_cover := NEW.cover_image_url IS NOT NULL AND length(btrim(NEW.cover_image_url)) > 0;
  has_card  := NEW.card_image_url  IS NOT NULL AND length(btrim(NEW.card_image_url))  > 0;
  has_gallery := EXISTS (SELECT 1 FROM public.project_images pi WHERE pi.project_id = NEW.id LIMIT 1);

  IF NOT (has_cover OR has_card OR has_gallery) THEN
    RAISE EXCEPTION 'Cannot publish project %: no photo attached (cover/card/gallery all empty)', NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_no_publish_without_photo ON public.projects;
CREATE TRIGGER trg_enforce_no_publish_without_photo
BEFORE INSERT OR UPDATE OF is_published, cover_image_url, card_image_url ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.enforce_no_publish_without_photo();

-- Trigger: when last gallery image is removed, auto-unpublish if project has no cover/card either
CREATE OR REPLACE FUNCTION public.auto_unpublish_on_last_image_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining int;
  proj public.projects%ROWTYPE;
BEGIN
  SELECT * INTO proj FROM public.projects WHERE id = OLD.project_id;
  IF proj.id IS NULL OR proj.is_published IS NOT TRUE THEN
    RETURN OLD;
  END IF;

  SELECT count(*) INTO remaining FROM public.project_images WHERE project_id = OLD.project_id;
  IF remaining = 0
     AND (proj.cover_image_url IS NULL OR length(btrim(proj.cover_image_url)) = 0)
     AND (proj.card_image_url  IS NULL OR length(btrim(proj.card_image_url))  = 0)
  THEN
    UPDATE public.projects SET is_published = false WHERE id = OLD.project_id;
    INSERT INTO public.project_audit_logs (project_id, action, after_data)
    VALUES (OLD.project_id, 'auto_unpublished_no_photo', jsonb_build_object('reason','last_image_removed'));
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_unpublish_on_last_image_removed ON public.project_images;
CREATE TRIGGER trg_auto_unpublish_on_last_image_removed
AFTER DELETE ON public.project_images
FOR EACH ROW
EXECUTE FUNCTION public.auto_unpublish_on_last_image_removed();

-- Backfill: unpublish any currently-published project with no photo + audit row
WITH offenders AS (
  SELECT p.id FROM public.projects p
  WHERE p.is_published = true
    AND (p.cover_image_url IS NULL OR length(btrim(p.cover_image_url)) = 0)
    AND (p.card_image_url  IS NULL OR length(btrim(p.card_image_url))  = 0)
    AND NOT EXISTS (SELECT 1 FROM public.project_images pi WHERE pi.project_id = p.id LIMIT 1)
),
updated AS (
  UPDATE public.projects p SET is_published = false
  FROM offenders o WHERE p.id = o.id
  RETURNING p.id
)
INSERT INTO public.project_audit_logs (project_id, action, after_data)
SELECT id, 'backfill_no_photo_lock', jsonb_build_object('reason','enforce_no_publish_without_photo','batch','2026-05-22')
FROM updated;
