
CREATE SEQUENCE IF NOT EXISTS public.document_booking_seq START 1 INCREMENT 1;

CREATE OR REPLACE FUNCTION public.next_booking_id(prefix text DEFAULT 'JBJ-DOC')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
  yr text;
BEGIN
  n := nextval('public.document_booking_seq');
  yr := to_char(now(), 'YYYY');
  RETURN format('%s-%s-%s', prefix, yr, lpad(n::text, 6, '0'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_booking_id(text) TO authenticated, service_role;
