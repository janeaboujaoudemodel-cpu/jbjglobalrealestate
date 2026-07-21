CREATE OR REPLACE FUNCTION public.validate_brokerage_outreach()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN NEW;
END;
$$;