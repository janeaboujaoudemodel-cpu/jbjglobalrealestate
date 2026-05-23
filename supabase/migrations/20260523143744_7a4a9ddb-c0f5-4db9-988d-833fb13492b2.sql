-- 1. URL validator
CREATE OR REPLACE FUNCTION public.is_valid_image_url(u text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text;
  l text;
BEGIN
  IF u IS NULL THEN RETURN false; END IF;
  s := btrim(u);
  IF s = '' THEN RETURN false; END IF;
  l := lower(s);

  -- must be http(s)
  IF l !~ '^https?://' THEN RETURN false; END IF;

  -- localhost / loopback / .local
  IF l ~ '^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(:|/|$)' THEN RETURN false; END IF;
  IF l ~ '\.local(:|/|$)' THEN RETURN false; END IF;

  -- known placeholder / dead patterns
  IF position('example.com' in l) > 0 THEN RETURN false; END IF;
  IF position('placeholder' in l) > 0 THEN RETURN false; END IF;
  IF position('via.placeholder' in l) > 0 THEN RETURN false; END IF;
  IF position('lorempixel' in l) > 0 THEN RETURN false; END IF;
  IF position('dummyimage' in l) > 0 THEN RETURN false; END IF;
  IF position('/undefined' in l) > 0 OR l ~ '[?&=](undefined|null)(&|$)' OR l ~ '/(undefined|null)(\.[a-z]+)?$' THEN RETURN false; END IF;

  -- ends with just a slash after host (no path/file)
  IF l ~ '^https?://[^/]+/?$' THEN RETURN false; END IF;

  RETURN true;
END;
$$;

-- 2. Tighten the publish trigger
CREATE OR REPLACE FUNCTION public.enforce_no_publish_without_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_cover boolean;
  has_card  boolean;
  has_gallery boolean;
BEGIN
  IF NEW.is_published IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  has_cover := public.is_valid_image_url(NEW.cover_image_url);
  has_card  := public.is_valid_image_url(NEW.card_image_url);
  has_gallery := EXISTS (
    SELECT 1 FROM public.project_images pi
    WHERE pi.project_id = NEW.id
      AND public.is_valid_image_url(pi.image_url)
    LIMIT 1
  );

  IF NOT (has_cover OR has_card OR has_gallery) THEN
    RAISE EXCEPTION 'Cannot publish project %: no valid photo attached (cover/card/gallery all empty or invalid)', NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Backfill: unpublish currently-published projects with no valid image, with audit log
DO $$
DECLARE
  r record;
  audit_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='audit_logs'
  ) INTO audit_exists;

  FOR r IN
    SELECT p.id, p.cover_image_url, p.card_image_url
    FROM public.projects p
    WHERE p.is_published = true
      AND NOT public.is_valid_image_url(p.cover_image_url)
      AND NOT public.is_valid_image_url(p.card_image_url)
      AND NOT EXISTS (
        SELECT 1 FROM public.project_images pi
        WHERE pi.project_id = p.id
          AND public.is_valid_image_url(pi.image_url)
      )
  LOOP
    UPDATE public.projects SET is_published = false WHERE id = r.id;

    IF audit_exists THEN
      BEGIN
        INSERT INTO public.audit_logs (action, resource_type, resource_id, metadata)
        VALUES (
          'auto_unpublish_invalid_image',
          'project',
          r.id::text,
          jsonb_build_object(
            'reason', 'no valid image url (cover/card/gallery)',
            'cover_image_url', r.cover_image_url,
            'card_image_url', r.card_image_url
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- audit table schema mismatch; skip silently, unpublish still applied
        NULL;
      END;
    END IF;
  END LOOP;
END $$;