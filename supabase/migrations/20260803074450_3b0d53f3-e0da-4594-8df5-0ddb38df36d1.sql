CREATE OR REPLACE FUNCTION public.classify_project_image_url(p_url text, p_alt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH d AS (SELECT replace(replace(coalesce(p_url,''), '%2F', '/'), '%2f', '/') AS u)
  SELECT CASE
    WHEN p_url IS NULL THEN 'unknown'
    WHEN (SELECT u FROM d) ~* '/flags?/' OR (SELECT u FROM d) ~* 'flag[-_]?icon' THEN 'flag'
    WHEN (SELECT u FROM d) ~* '[?&](w|width)=([0-9]|[1-9][0-9])(&|$)' THEN 'icon'
    WHEN (SELECT u FROM d) ~* 'logo|wordmark|favicon' THEN 'logo'
    WHEN (SELECT u FROM d) ~* 'payment[-_ ]?plan|payment[-_ ]?schedule' OR coalesce(p_alt,'') ~* 'payment plan' THEN 'payment_plan'
    WHEN (SELECT u FROM d) ~* 'fact[-_ ]?sheet|factsheet' OR coalesce(p_alt,'') ~* 'fact sheet' THEN 'fact_sheet'
    WHEN (SELECT u FROM d) ~* 'floor[-_ ]?plan|unit[-_ ]?plan' THEN 'floor_plan'
    WHEN (SELECT u FROM d) ~* 'master[-_ ]?plan|site[-_ ]?plan' THEN 'master_plan'
    WHEN (SELECT u FROM d) ~* 'broker[-_ ]?kit|agent[-_ ]?kit|/kit/|brand[-_ ]?guideline|company[-_ ]?profile' THEN 'broker_kit'
    WHEN (SELECT u FROM d) ~* 'brochure' THEN 'brochure_page'
    WHEN (SELECT u FROM d) ~* 'location[-_ ]?map|google\.com/maps' THEN 'location_map'
    ELSE 'gallery'
  END;
$$;

UPDATE public.project_images
SET asset_role = public.classify_project_image_url(image_url, alt_text);