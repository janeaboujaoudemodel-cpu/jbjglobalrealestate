-- Strict publish readiness gate for projects
CREATE OR REPLACE FUNCTION public.project_publish_blockers(_project_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.projects%ROWTYPE;
  blockers text[] := ARRAY[]::text[];
  image_count integer := 0;
  doc_count integer := 0;
BEGIN
  SELECT * INTO p FROM public.projects WHERE id = _project_id;
  IF p.id IS NULL THEN
    RETURN ARRAY['project_not_found'];
  END IF;

  SELECT count(*) INTO image_count FROM public.project_images pi WHERE pi.project_id = _project_id;
  SELECT count(*) INTO doc_count FROM public.project_documents pd WHERE pd.project_id = _project_id;

  IF (p.cover_image_url IS NULL OR length(btrim(p.cover_image_url)) = 0)
     AND (p.card_image_url IS NULL OR length(btrim(p.card_image_url)) = 0)
     AND image_count = 0 THEN
    blockers := array_append(blockers, 'missing_media');
  END IF;

  IF p.developer_id IS NULL AND (p.developer_name IS NULL OR length(btrim(p.developer_name)) = 0 OR lower(btrim(p.developer_name)) = 'unknown') THEN
    blockers := array_append(blockers, 'missing_developer');
  END IF;

  IF p.description IS NULL OR length(btrim(p.description)) < 50 THEN
    blockers := array_append(blockers, 'missing_description');
  END IF;

  IF p.price_from IS NULL OR p.price_from <= 0 THEN
    blockers := array_append(blockers, 'missing_price');
  END IF;

  IF (p.location IS NULL OR length(btrim(p.location)) = 0)
     AND (p.area_name IS NULL OR length(btrim(p.area_name)) = 0)
     AND p.area_id IS NULL THEN
    blockers := array_append(blockers, 'missing_location');
  END IF;

  IF p.bedrooms_min IS NULL
     AND p.bedrooms_max IS NULL
     AND (p.unit_types IS NULL OR p.unit_types = '[]'::jsonb)
     AND (p.bedroom_types IS NULL OR p.bedroom_types = '[]'::jsonb)
     AND (p.property_type_label IS NULL OR length(btrim(p.property_type_label)) = 0) THEN
    blockers := array_append(blockers, 'missing_unit_details');
  END IF;

  IF doc_count = 0
     AND (p.floor_plan_types IS NULL OR p.floor_plan_types = '[]'::jsonb)
     AND (p.payment_plan IS NULL OR length(btrim(p.payment_plan)) = 0)
     AND (p.payment_breakdown IS NULL OR p.payment_breakdown = '{}'::jsonb) THEN
    blockers := array_append(blockers, 'missing_documents_or_plan');
  END IF;

  RETURN blockers;
END;
$$;

CREATE OR REPLACE FUNCTION public.project_is_ready_to_publish(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cardinality(public.project_publish_blockers(_project_id)) = 0;
$$;

CREATE OR REPLACE FUNCTION public.enforce_project_publish_readiness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blockers text[];
BEGIN
  IF NEW.is_published IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  blockers := public.project_publish_blockers(NEW.id);
  IF cardinality(blockers) > 0 THEN
    RAISE EXCEPTION 'Cannot publish project %: missing required listing data: %', NEW.id, array_to_string(blockers, ',')
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_project_publish_readiness ON public.projects;
CREATE TRIGGER trg_enforce_project_publish_readiness
BEFORE INSERT OR UPDATE OF is_published, cover_image_url, card_image_url, developer_id, developer_name, description, price_from, location, area_name, area_id, bedrooms_min, bedrooms_max, unit_types, bedroom_types, property_type_label, floor_plan_types, payment_plan, payment_breakdown
ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.enforce_project_publish_readiness();

WITH offenders AS (
  SELECT p.id, public.project_publish_blockers(p.id) AS blockers
  FROM public.projects p
  WHERE p.is_published = true
    AND cardinality(public.project_publish_blockers(p.id)) > 0
), updated AS (
  UPDATE public.projects p
  SET is_published = false,
      updated_at = now()
  FROM offenders o
  WHERE p.id = o.id
  RETURNING p.id, o.blockers
)
INSERT INTO public.project_audit_logs (project_id, action, after_data)
SELECT id, 'auto_unpublished_incomplete_listing', jsonb_build_object('reason','strict_publish_readiness','blockers', blockers)
FROM updated;