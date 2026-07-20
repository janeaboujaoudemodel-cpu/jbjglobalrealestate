CREATE OR REPLACE FUNCTION public.jbj_text_is_real(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT value IS NOT NULL
    AND btrim(value) <> ''
    AND lower(btrim(value)) NOT IN ('tba', 'tbd', 'n/a', 'na', 'on request', 'price on request', 'upon request', 'coming soon')
    AND lower(btrim(value)) NOT LIKE 'project general facts%';
$$;

CREATE OR REPLACE FUNCTION public.jbj_url_is_valid_project_photo(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT value IS NOT NULL
    AND btrim(value) <> ''
    AND value ~* '^(https?://|/)'
    AND value !~* '(flags|favicon|google\.com/s2|logo|brand|icon|placeholder|base64|<base64|whatsapp|screenshot|fact.?sheet|factsheet|\.mp4(\?|$))';
$$;

CREATE OR REPLACE FUNCTION public.jbj_url_is_valid_developer_logo(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT value IS NOT NULL
    AND btrim(value) <> ''
    AND value ~* '^(https?://|/)'
    AND value !~* '(favicon|google\.com/s2|placeholder|base64|<base64|screenshot|whatsapp|convert\.io|/projects/[0-9]+/images|feature_|/x/16x16/)';
$$;

CREATE OR REPLACE FUNCTION public.jbj_project_publish_blockers_for_row(project_row public.projects)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blockers text[] := ARRAY[]::text[];
  has_photo boolean := false;
  has_logo boolean := false;
BEGIN
  IF project_row.id IS NULL THEN
    RETURN ARRAY['project_not_found'];
  END IF;

  has_photo := public.jbj_url_is_valid_project_photo(project_row.cover_image_url)
    OR public.jbj_url_is_valid_project_photo(project_row.card_image_url)
    OR public.jbj_url_is_valid_project_photo(project_row.gallery_start_image_url)
    OR EXISTS (
      SELECT 1
      FROM public.project_images pi
      WHERE pi.project_id = project_row.id
        AND public.jbj_url_is_valid_project_photo(pi.image_url)
      LIMIT 1
    );

  SELECT public.jbj_url_is_valid_developer_logo(d.logo_url)
  INTO has_logo
  FROM public.developers d
  WHERE d.id = project_row.developer_id;

  IF NOT COALESCE(has_photo, false) THEN blockers := array_append(blockers, 'missing_project_photo'); END IF;
  IF NOT public.jbj_text_is_real(COALESCE(project_row.description, project_row.short_description)) THEN blockers := array_append(blockers, 'missing_description'); END IF;
  IF COALESCE(project_row.price_from, 0) <= 0 THEN blockers := array_append(blockers, 'missing_starting_price'); END IF;
  IF NOT public.jbj_text_is_real(COALESCE(project_row.handover_date, project_row.expected_completion)) THEN blockers := array_append(blockers, 'missing_handover'); END IF;
  IF NOT public.jbj_text_is_real(project_row.payment_plan) THEN blockers := array_append(blockers, 'missing_payment_plan'); END IF;
  IF COALESCE(project_row.size_min, 0) <= 0 THEN blockers := array_append(blockers, 'missing_size'); END IF;
  IF COALESCE(project_row.bedrooms_max, project_row.bedrooms_min) IS NULL
     AND (project_row.bedroom_types IS NULL OR project_row.bedroom_types = '[]'::jsonb)
     AND (project_row.unit_types IS NULL OR project_row.unit_types = '[]'::jsonb) THEN
    blockers := array_append(blockers, 'missing_bedrooms');
  END IF;
  IF project_row.developer_id IS NULL THEN blockers := array_append(blockers, 'missing_developer'); END IF;
  IF project_row.developer_id IS NOT NULL AND NOT COALESCE(has_logo, false) THEN blockers := array_append(blockers, 'missing_developer_logo'); END IF;

  RETURN blockers;
END;
$$;

CREATE OR REPLACE FUNCTION public.project_publish_blockers(_project_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.projects%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.projects WHERE id = _project_id;
  IF p.id IS NULL THEN
    RETURN ARRAY['project_not_found'];
  END IF;
  RETURN public.jbj_project_publish_blockers_for_row(p);
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_project_publish_readiness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blockers text[];
  publishing_now boolean;
  readiness_field_changed boolean;
BEGIN
  IF NEW.is_published IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  publishing_now := TG_OP = 'INSERT' OR OLD.is_published IS DISTINCT FROM TRUE;

  readiness_field_changed :=
    NEW.is_published IS DISTINCT FROM OLD.is_published OR
    NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url OR
    NEW.card_image_url IS DISTINCT FROM OLD.card_image_url OR
    NEW.gallery_start_image_url IS DISTINCT FROM OLD.gallery_start_image_url OR
    NEW.description IS DISTINCT FROM OLD.description OR
    NEW.short_description IS DISTINCT FROM OLD.short_description OR
    NEW.price_from IS DISTINCT FROM OLD.price_from OR
    NEW.location IS DISTINCT FROM OLD.location OR
    NEW.area_name IS DISTINCT FROM OLD.area_name OR
    NEW.area_id IS DISTINCT FROM OLD.area_id OR
    NEW.bedrooms_min IS DISTINCT FROM OLD.bedrooms_min OR
    NEW.bedrooms_max IS DISTINCT FROM OLD.bedrooms_max OR
    NEW.unit_types IS DISTINCT FROM OLD.unit_types OR
    NEW.bedroom_types IS DISTINCT FROM OLD.bedroom_types OR
    NEW.property_type_label IS DISTINCT FROM OLD.property_type_label OR
    NEW.floor_plan_types IS DISTINCT FROM OLD.floor_plan_types OR
    NEW.payment_plan IS DISTINCT FROM OLD.payment_plan OR
    NEW.payment_breakdown IS DISTINCT FROM OLD.payment_breakdown OR
    NEW.handover_date IS DISTINCT FROM OLD.handover_date OR
    NEW.expected_completion IS DISTINCT FROM OLD.expected_completion OR
    NEW.developer_id IS DISTINCT FROM OLD.developer_id;

  IF NOT publishing_now AND NOT readiness_field_changed THEN
    RETURN NEW;
  END IF;

  blockers := public.jbj_project_publish_blockers_for_row(NEW);
  IF cardinality(blockers) > 0 THEN
    RAISE EXCEPTION 'Cannot publish project %: missing required listing data: %', NEW.id, array_to_string(blockers, ',')
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Draft known broken rows first; AGUA source currently exposes fact-sheet/menu images and a video, not a verified card image/details set.
UPDATE public.projects p
SET
  is_published = false,
  status = 'draft_needs_enrichment',
  needs_enrichment = true,
  enrichment_flags = COALESCE(p.enrichment_flags, '{}'::jsonb) || jsonb_build_object(
    'publish_blocked', true,
    'publish_blockers', jsonb_build_array('missing_verified_project_photo_or_details'),
    'blocked_at', now(),
    'blocked_reason', 'Official source did not provide a verified usable public card image/details set'
  ),
  cover_image_url = CASE WHEN p.cover_image_url ILIKE '%flags%' OR p.cover_image_url ILIKE '%fact%' THEN NULL ELSE p.cover_image_url END,
  card_image_url = CASE WHEN p.card_image_url ILIKE '%flags%' OR p.card_image_url ILIKE '%fact%' THEN NULL ELSE p.card_image_url END,
  gallery_start_image_url = CASE WHEN p.gallery_start_image_url ILIKE '%flags%' OR p.gallery_start_image_url ILIKE '%fact%' THEN NULL ELSE p.gallery_start_image_url END,
  updated_at = now()
WHERE p.slug IN ('agua', 'agua-residences-citi-developers-2314', 'in-al-hamra-village');

-- Verified Al Hamra repair: source page image/details; do not change the approved locked developer logo.
UPDATE public.projects p
SET
  developer_id = '645ac2ac-cdb2-4076-b380-324d0ef792f5'::uuid,
  developer_name = 'Al Hamra',
  cover_image_url = 'https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/off-plan/1948/images/2024/05/17/Qw6V56kJllphJlS1UvwwoEiTBijtNiIWr8u32dEe.png',
  card_image_url = 'https://alhamra.ae/media/rkipmlry/al-hamra-village-1-min.jpg?width=475&height=398',
  gallery_start_image_url = 'https://alhamra.ae/media/rkipmlry/al-hamra-village-1-min.jpg?width=475&height=398',
  description = 'Al Hamra Village is a residential community in Ras Al Khaimah by Al Hamra, offering studios, apartments, villas and townhouses with beach, golf, gym, pool, playground, parking, security, green spaces and community amenities.',
  short_description = 'Residential community in Ras Al Khaimah by Al Hamra with apartments, villas, townhouses, beach, golf and family amenities.',
  price_from = 2280000,
  handover_date = 'Ready',
  expected_completion = 'Ready',
  payment_plan = 'Ready property — payment on transfer',
  bedrooms_min = 0,
  bedrooms_max = 5,
  size_min = 400,
  size_max = 5000,
  status = 'available',
  needs_enrichment = false,
  enrichment_flags = COALESCE(p.enrichment_flags, '{}'::jsonb) - 'publish_blocked' - 'publish_blockers',
  updated_at = now()
WHERE p.slug = 'al-hamra-village-al-hamra-al-hamra-village';

-- Move every existing public project that still fails the strict gate into draft review.
UPDATE public.projects p
SET
  is_published = false,
  status = 'draft_needs_enrichment',
  needs_enrichment = true,
  enrichment_flags = COALESCE(p.enrichment_flags, '{}'::jsonb) || jsonb_build_object(
    'publish_blocked', true,
    'publish_blockers', to_jsonb(public.project_publish_blockers(p.id)),
    'blocked_at', now()
  ),
  updated_at = now()
WHERE p.is_published = true
  AND cardinality(public.project_publish_blockers(p.id)) > 0;

-- Keep repaired Al Hamra visible only after it passes the strict gate.
UPDATE public.projects p
SET is_published = true, updated_at = now()
WHERE p.slug = 'al-hamra-village-al-hamra-al-hamra-village'
  AND cardinality(public.project_publish_blockers(p.id)) = 0;

COMMENT ON FUNCTION public.project_publish_blockers(uuid) IS 'Locked public-quality gate: no project can publish without real media, details, developer and logo.';