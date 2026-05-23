CREATE OR REPLACE FUNCTION public.is_valid_image_url(u text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  s text;
  l text;
BEGIN
  IF u IS NULL THEN RETURN false; END IF;
  s := btrim(u);
  IF s = '' THEN RETURN false; END IF;
  l := lower(s);
  IF l !~ '^https?://' THEN RETURN false; END IF;
  IF l ~ '^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(:|/|$)' THEN RETURN false; END IF;
  IF l ~ '\.local(:|/|$)' THEN RETURN false; END IF;
  IF position('example.com' in l) > 0 THEN RETURN false; END IF;
  IF position('placeholder' in l) > 0 THEN RETURN false; END IF;
  IF position('via.placeholder' in l) > 0 THEN RETURN false; END IF;
  IF position('lorempixel' in l) > 0 THEN RETURN false; END IF;
  IF position('dummyimage' in l) > 0 THEN RETURN false; END IF;
  IF position('/undefined' in l) > 0 OR l ~ '[?&=](undefined|null)(&|$)' OR l ~ '/(undefined|null)(\.[a-z]+)?$' THEN RETURN false; END IF;
  IF l ~ '^https?://[^/]+/?$' THEN RETURN false; END IF;
  RETURN true;
END;
$$;