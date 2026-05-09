-- 1) Harden envelope token check: require caller to present matching token
CREATE OR REPLACE FUNCTION public._esign_envelope_has_token_recipient(_envelope_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _header_token text;
BEGIN
  BEGIN
    _header_token := (current_setting('request.headers', true)::json ->> 'x-signing-token');
  EXCEPTION WHEN OTHERS THEN
    _header_token := NULL;
  END;

  IF _header_token IS NULL OR length(_header_token) < 8 THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.esign_recipients r
    WHERE r.envelope_id = _envelope_id
      AND r.signing_token IS NOT NULL
      AND r.signing_token::text = _header_token
  );
END;
$function$;

-- 2) Remove public storage policy on signed documents
DROP POLICY IF EXISTS "Public can view signed documents" ON storage.objects;

-- Sender (folder[1] = auth.uid()) can already read via "Users can view their esign documents".
-- Recipients receive signed docs via authenticated edge functions / signed URLs.