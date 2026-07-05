-- 1. Drop the permissive anon SELECT policy that allowed enumeration
DROP POLICY IF EXISTS "Anyone can look up a token to prefill the form" ON public.meeting_booking_tokens;

-- 2. Secure lookup function: only returns a row when the caller supplies the exact token
CREATE OR REPLACE FUNCTION public.get_booking_token(_token text)
RETURNS TABLE (
  contact_name text,
  contact_email text,
  contact_company text,
  default_language text,
  default_location_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.contact_name,
    t.contact_email,
    t.contact_company,
    t.default_language,
    t.default_location_type
  FROM public.meeting_booking_tokens t
  WHERE t.token = _token
    AND t.expires_at > now()
    AND t.consumed_at IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_booking_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_token(text) TO anon, authenticated;