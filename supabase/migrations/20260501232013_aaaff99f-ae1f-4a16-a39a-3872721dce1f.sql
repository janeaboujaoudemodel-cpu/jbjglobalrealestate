CREATE OR REPLACE FUNCTION public.enforce_cover_before_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_published = true
     AND (NEW.cover_image_url IS NULL OR length(trim(NEW.cover_image_url)) = 0)
  THEN
    RAISE EXCEPTION 'Cannot publish project "%": cover image is required before going live.',
      COALESCE(NEW.name, NEW.id::text)
      USING ERRCODE = 'check_violation',
            HINT = 'Upload a cover image in Listing Admin, then re-publish.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_cover_before_publish ON public.projects;

CREATE TRIGGER trg_enforce_cover_before_publish
BEFORE INSERT OR UPDATE OF is_published, cover_image_url
ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.enforce_cover_before_publish();

COMMENT ON FUNCTION public.enforce_cover_before_publish() IS
  'Blocks is_published=true on projects rows without a cover_image_url. Pairs with the public useProjects listing filter.';