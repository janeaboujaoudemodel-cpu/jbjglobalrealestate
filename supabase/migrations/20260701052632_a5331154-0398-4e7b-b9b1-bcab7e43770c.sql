-- Expose ONLY the non-secret marketing IDs (GA4, GTM, pixel IDs, Clarity)
-- to anon/authenticated via a SECURITY DEFINER RPC. The base table stays
-- locked to owner/admin so Zapier webhooks and other secrets remain
-- restricted.
CREATE OR REPLACE FUNCTION public.get_public_marketing_config()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mc.key, mc.value
  FROM public.marketing_config mc
  WHERE mc.key IN (
    'ga4MeasurementId',
    'gtmContainerId',
    'metaPixelId',
    'linkedInPartnerId',
    'clarityProjectId',
    'tiktokPixelId'
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_marketing_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_marketing_config() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_marketing_config() IS
  'Returns only non-secret marketing tracking IDs safe for public site visitors. Base marketing_config table remains restricted to owner/admin.';