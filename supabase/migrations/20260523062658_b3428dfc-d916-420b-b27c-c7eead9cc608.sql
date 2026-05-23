CREATE OR REPLACE FUNCTION public.enforce_project_publish_readiness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blockers text[];
  first_gallery_image text;
BEGIN
  IF NEW.is_published IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  IF (NEW.cover_image_url IS NULL OR length(btrim(NEW.cover_image_url)) = 0)
     AND (NEW.card_image_url IS NULL OR length(btrim(NEW.card_image_url)) = 0) THEN
    SELECT pi.image_url INTO first_gallery_image
    FROM public.project_images pi
    WHERE pi.project_id = NEW.id
      AND pi.image_url IS NOT NULL
      AND length(btrim(pi.image_url)) > 0
    ORDER BY pi.display_order NULLS LAST, pi.created_at NULLS LAST, pi.id
    LIMIT 1;

    IF first_gallery_image IS NOT NULL THEN
      NEW.cover_image_url := first_gallery_image;
    END IF;
  END IF;

  blockers := public.project_publish_blockers(NEW.id);
  IF cardinality(blockers) > 0 THEN
    RAISE EXCEPTION 'Cannot publish project %: missing required listing data: %', NEW.id, array_to_string(blockers, ',')
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.projects p
SET cover_image_url = (
      SELECT pi.image_url
      FROM public.project_images pi
      WHERE pi.project_id = p.id
        AND pi.image_url IS NOT NULL
        AND length(btrim(pi.image_url)) > 0
      ORDER BY pi.display_order NULLS LAST, pi.created_at NULLS LAST, pi.id
      LIMIT 1
    ),
    updated_at = now()
WHERE (p.cover_image_url IS NULL OR length(btrim(p.cover_image_url)) = 0)
  AND (p.card_image_url IS NULL OR length(btrim(p.card_image_url)) = 0)
  AND EXISTS (
    SELECT 1
    FROM public.project_images pi
    WHERE pi.project_id = p.id
      AND pi.image_url IS NOT NULL
      AND length(btrim(pi.image_url)) > 0
  );