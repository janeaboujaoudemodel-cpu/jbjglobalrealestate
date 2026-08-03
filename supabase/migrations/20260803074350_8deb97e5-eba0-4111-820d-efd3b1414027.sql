-- 1. Asset role labelling for project photos
ALTER TABLE public.project_images
  ADD COLUMN IF NOT EXISTS asset_role text;

CREATE OR REPLACE FUNCTION public.classify_project_image_url(p_url text, p_alt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_url IS NULL THEN 'unknown'
    WHEN p_url ~* '/flags?/' OR p_url ~* 'flag[-_]?icon' THEN 'flag'
    WHEN p_url ~* '[?&](w|width)=([0-9]|[1-9][0-9])(&|$)' THEN 'icon'
    WHEN p_url ~* 'logo|wordmark|favicon' THEN 'logo'
    WHEN p_url ~* 'payment[-_ ]?plan|payment[-_ ]?schedule' OR coalesce(p_alt,'') ~* 'payment plan' THEN 'payment_plan'
    WHEN p_url ~* 'fact[-_ ]?sheet|factsheet' OR coalesce(p_alt,'') ~* 'fact sheet' THEN 'fact_sheet'
    WHEN p_url ~* 'floor[-_ ]?plan|unit[-_ ]?plan' THEN 'floor_plan'
    WHEN p_url ~* 'master[-_ ]?plan|site[-_ ]?plan' THEN 'master_plan'
    WHEN p_url ~* 'broker[-_ ]?kit|agent[-_ ]?kit|/kit/|brand[-_ ]?guideline|company[-_ ]?profile' THEN 'broker_kit'
    WHEN p_url ~* 'brochure' THEN 'brochure_page'
    WHEN p_url ~* 'location[-_ ]?map|google\.com/maps' THEN 'location_map'
    ELSE 'gallery'
  END;
$$;

UPDATE public.project_images
SET asset_role = public.classify_project_image_url(image_url, alt_text)
WHERE asset_role IS NULL;

-- 2. Real facts for the thin ARYA / AGUA records, copied from their enriched twins
UPDATE public.projects t
SET description   = COALESCE(NULLIF(t.description, ''), s.description),
    price_from    = COALESCE(t.price_from, s.price_from),
    price_to      = COALESCE(t.price_to, s.price_to),
    handover_date = COALESCE(t.handover_date, s.handover_date),
    bedrooms_min  = s.bedrooms_min,
    bedrooms_max  = s.bedrooms_max,
    size_min      = s.size_min,
    size_max      = s.size_max
FROM public.projects s
WHERE t.id = '9a7e228e-7023-42eb-8b90-1dcd86698049'
  AND s.id = '898c26d1-a22b-4c58-b802-65853609c885';

UPDATE public.projects t
SET description   = COALESCE(NULLIF(t.description, ''), s.description),
    price_from    = COALESCE(t.price_from, s.price_from),
    price_to      = COALESCE(t.price_to, s.price_to),
    handover_date = COALESCE(t.handover_date, s.handover_date),
    size_min      = s.size_min,
    size_max      = s.size_max
FROM public.projects s
WHERE t.id = 'd37d6d63-bb7c-458b-9fb8-50574c7291e2'
  AND s.id = '36517cf3-bcab-436e-9f99-e5ff0de05ddd';