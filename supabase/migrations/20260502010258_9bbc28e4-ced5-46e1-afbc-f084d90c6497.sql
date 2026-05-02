-- 1) Backfill: promote a project_images row into cover_image_url for any published
--    project that lacks one. This rescues listings that DO have media, just not in
--    the cover field, so they keep showing publicly without changes.
UPDATE public.projects p
SET cover_image_url = sub.image_url
FROM (
  SELECT DISTINCT ON (pi.project_id)
    pi.project_id,
    pi.image_url
  FROM public.project_images pi
  WHERE pi.image_url IS NOT NULL AND length(trim(pi.image_url)) > 0
  ORDER BY pi.project_id, pi.display_order NULLS LAST, pi.created_at NULLS LAST
) sub
WHERE p.id = sub.project_id
  AND p.is_published = true
  AND (p.cover_image_url IS NULL OR length(trim(p.cover_image_url)) = 0)
  AND (p.card_image_url IS NULL OR length(trim(p.card_image_url)) = 0);

-- 2) Unpublish: any project that is still published with no usable media at all
--    is moved back to the admin's Pending Approval queue (is_published=false).
--    Nothing is deleted — admins can re-publish after uploading media.
--    The trigger blocks re-publish until media is provided.
--
--    NOTE: the existing trigger trg_enforce_cover_before_publish would block
--    direct UPDATEs that try to publish without a cover, but it allows setting
--    is_published=false freely.
UPDATE public.projects
SET is_published = false,
    updated_at = now()
WHERE is_published = true
  AND (cover_image_url IS NULL OR length(trim(cover_image_url)) = 0)
  AND (card_image_url IS NULL OR length(trim(card_image_url)) = 0)
  AND NOT EXISTS (
    SELECT 1 FROM public.project_images pi
    WHERE pi.project_id = projects.id
      AND pi.image_url IS NOT NULL
      AND length(trim(pi.image_url)) > 0
  );

-- 3) Strengthen the publish-gate trigger so it accepts any of the three media
--    sources (cover_image_url / card_image_url / project_images row) as proof
--    of media. Mirrors what the public UI considers a renderable listing.
CREATE OR REPLACE FUNCTION public.enforce_cover_before_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_gallery_image boolean;
BEGIN
  IF NEW.is_published = true THEN
    -- Cheap check first: cover or card field already filled.
    IF (NEW.cover_image_url IS NOT NULL AND length(trim(NEW.cover_image_url)) > 0)
       OR (NEW.card_image_url IS NOT NULL AND length(trim(NEW.card_image_url)) > 0)
    THEN
      RETURN NEW;
    END IF;

    -- Fallback: at least one usable project_images row.
    SELECT EXISTS (
      SELECT 1 FROM public.project_images pi
      WHERE pi.project_id = NEW.id
        AND pi.image_url IS NOT NULL
        AND length(trim(pi.image_url)) > 0
    ) INTO has_gallery_image;

    IF NOT has_gallery_image THEN
      RAISE EXCEPTION 'Cannot publish project "%": media (cover, card, or gallery image) is required before going live.',
        COALESCE(NEW.name, NEW.id::text)
        USING ERRCODE = 'check_violation',
              HINT  = 'Upload a cover image or at least one project image in Listing Admin, then re-publish.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;