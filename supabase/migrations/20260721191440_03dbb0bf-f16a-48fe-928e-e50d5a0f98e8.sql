CREATE OR REPLACE FUNCTION public.validate_outreach_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND btrim(NEW.email) <> '' AND NEW.email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'email must be a valid email address';
  END IF;

  IF NEW.phone IS NOT NULL AND btrim(NEW.phone) <> '' AND NEW.phone !~ '^[-+() 0-9|]{6,80}$' THEN
    RAISE EXCEPTION 'phone must be a valid phone number';
  END IF;

  RETURN NEW;
END;
$$;