CREATE OR REPLACE FUNCTION public.validate_outreach_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND btrim(NEW.email) <> '' AND NEW.email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'email must be a valid email address';
  END IF;

  RETURN NEW;
END;
$$;