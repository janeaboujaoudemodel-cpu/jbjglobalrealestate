ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS field_sources jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.mark_registry_field_sources()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ts text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
BEGIN
  IF NEW.field_sources IS NULL THEN
    NEW.field_sources := '{}'::jsonb;
  END IF;

  IF NEW.phone IS DISTINCT FROM OLD.phone
     AND COALESCE(NEW.field_sources -> 'phone', 'null'::jsonb) = COALESCE(OLD.field_sources -> 'phone', 'null'::jsonb) THEN
    NEW.field_sources := jsonb_set(NEW.field_sources, '{phone}', jsonb_build_object('source','manual','fetched_at',ts), true);
  END IF;

  IF NEW.developer_email IS DISTINCT FROM OLD.developer_email
     AND COALESCE(NEW.field_sources -> 'developer_email', 'null'::jsonb) = COALESCE(OLD.field_sources -> 'developer_email', 'null'::jsonb) THEN
    NEW.field_sources := jsonb_set(NEW.field_sources, '{developer_email}', jsonb_build_object('source','manual','fetched_at',ts), true);
  END IF;

  IF NEW.emirate IS DISTINCT FROM OLD.emirate
     AND COALESCE(NEW.field_sources -> 'emirate', 'null'::jsonb) = COALESCE(OLD.field_sources -> 'emirate', 'null'::jsonb) THEN
    NEW.field_sources := jsonb_set(NEW.field_sources, '{emirate}', jsonb_build_object('source','manual','fetched_at',ts), true);
  END IF;

  IF NEW.website IS DISTINCT FROM OLD.website
     AND COALESCE(NEW.field_sources -> 'website', 'null'::jsonb) = COALESCE(OLD.field_sources -> 'website', 'null'::jsonb) THEN
    NEW.field_sources := jsonb_set(NEW.field_sources, '{website}', jsonb_build_object('source','manual','fetched_at',ts), true);
  END IF;

  IF NEW.developer_contact IS DISTINCT FROM OLD.developer_contact
     AND COALESCE(NEW.field_sources -> 'developer_contact', 'null'::jsonb) = COALESCE(OLD.field_sources -> 'developer_contact', 'null'::jsonb) THEN
    NEW.field_sources := jsonb_set(NEW.field_sources, '{developer_contact}', jsonb_build_object('source','manual','fetched_at',ts), true);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_registry_field_sources ON public.crm_developer_registry;
CREATE TRIGGER trg_mark_registry_field_sources
  BEFORE UPDATE ON public.crm_developer_registry
  FOR EACH ROW EXECUTE FUNCTION public.mark_registry_field_sources();