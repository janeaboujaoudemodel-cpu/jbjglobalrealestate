ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS review_flagged_at timestamptz,
  ADD COLUMN IF NOT EXISTS unverified_snapshot jsonb;

WITH targets AS (
  SELECT id, website_url, founded_year, ceo_name, parent_company,
         specialization, headquarters, office_address, google_maps_url
  FROM public.developers
  WHERE last_confirmed_at IS NULL
),
snap AS (
  SELECT id,
    jsonb_strip_nulls(jsonb_build_object(
      'website_url',      website_url,
      'founded_year',     founded_year,
      'ceo_name',         ceo_name,
      'parent_company',   parent_company,
      'specialization',   specialization,
      'headquarters',     headquarters,
      'office_address',   office_address,
      'google_maps_url',  google_maps_url
    )) AS snap
  FROM targets
)
UPDATE public.developers d
SET
  website_url      = NULL,
  founded_year     = NULL,
  ceo_name         = NULL,
  parent_company   = NULL,
  specialization   = NULL,
  headquarters     = NULL,
  office_address   = NULL,
  google_maps_url  = NULL,
  needs_review     = true,
  review_flagged_at = COALESCE(d.review_flagged_at, now()),
  unverified_snapshot = snap.snap,
  review_flags = (
    SELECT COALESCE(jsonb_agg(k), '[]'::jsonb)
    FROM jsonb_object_keys(snap.snap) AS k
  )
FROM snap
WHERE d.id = snap.id
  AND snap.snap <> '{}'::jsonb;

UPDATE public.developers
SET headquarters = NULL,
    office_address = NULL,
    google_maps_url = NULL
WHERE headquarters IS NOT NULL
   OR office_address IS NOT NULL
   OR google_maps_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS developers_needs_review_idx
  ON public.developers (needs_review) WHERE needs_review = true;