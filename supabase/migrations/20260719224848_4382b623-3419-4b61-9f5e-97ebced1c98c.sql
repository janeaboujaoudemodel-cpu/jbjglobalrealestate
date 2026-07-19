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
    NEW.description IS DISTINCT FROM OLD.description OR
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
    NEW.payment_breakdown IS DISTINCT FROM OLD.payment_breakdown;

  -- Developer relinking is a data-repair operation that can only improve logo/profile joins.
  -- Do not re-block already-published legacy rows for unrelated old content gaps.
  IF NOT publishing_now AND NOT readiness_field_changed THEN
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