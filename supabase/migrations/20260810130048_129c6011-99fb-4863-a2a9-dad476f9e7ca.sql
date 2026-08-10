CREATE TABLE IF NOT EXISTS public.search_area_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias text NOT NULL,
  alias_norm text NOT NULL,
  area_slug text NOT NULL,
  area_name text NOT NULL,
  country_slug text,
  region_slug text,
  hits integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS search_area_aliases_norm_key ON public.search_area_aliases (alias_norm);

GRANT SELECT ON public.search_area_aliases TO anon, authenticated;
GRANT ALL ON public.search_area_aliases TO service_role;

ALTER TABLE public.search_area_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read learned search aliases" ON public.search_area_aliases;
CREATE POLICY "Anyone can read learned search aliases"
  ON public.search_area_aliases FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.learn_area_alias(
  _alias text,
  _area_slug text,
  _area_name text,
  _country_slug text DEFAULT NULL,
  _region_slug text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text;
BEGIN
  norm := lower(regexp_replace(coalesce(_alias, ''), '[^a-z0-9]+', ' ', 'gi'));
  norm := btrim(norm);
  IF norm = '' OR length(norm) > 120 OR coalesce(_area_slug,'') = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.search_area_aliases (alias, alias_norm, area_slug, area_name, country_slug, region_slug)
  VALUES (left(_alias, 200), norm, _area_slug, coalesce(_area_name, _area_slug), _country_slug, _region_slug)
  ON CONFLICT (alias_norm) DO UPDATE
    SET hits = public.search_area_aliases.hits + 1,
        area_slug = EXCLUDED.area_slug,
        area_name = EXCLUDED.area_name,
        country_slug = COALESCE(EXCLUDED.country_slug, public.search_area_aliases.country_slug),
        region_slug = COALESCE(EXCLUDED.region_slug, public.search_area_aliases.region_slug),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.learn_area_alias(text, text, text, text, text) TO anon, authenticated;