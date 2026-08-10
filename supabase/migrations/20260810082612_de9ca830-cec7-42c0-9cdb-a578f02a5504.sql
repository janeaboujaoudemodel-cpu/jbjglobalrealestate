UPDATE public.developers
SET feature_image_url = 'https://static.propsearch.ae/dubai-locations/dubai-sustainable-city-14257.jpg',
    updated_at = now()
WHERE id = '3c119e24-8298-437e-92b5-8839cda71679'
  AND coalesce(feature_image_url,'') = '';

UPDATE public.developers
SET feature_image_url = 'https://static.propsearch.ae/dubai-locations/sunbeam-homes_KAdBc.jpg',
    updated_at = now()
WHERE id = 'f8666d1e-0571-4c38-b68f-63522b63c2e9'
  AND coalesce(feature_image_url,'') = '';

INSERT INTO public.developer_media_repair_attempts (developer_id, batch, outcome, note)
SELECT '3c119e24-8298-437e-92b5-8839cda71679'::uuid, 14, 'fixed', 'Cover: The Sustainable City master community photo (public developer directory)'
UNION ALL
SELECT 'f8666d1e-0571-4c38-b68f-63522b63c2e9'::uuid, 14, 'fixed', 'Cover: Sunbeam Homes villas photo (public developer directory)';

INSERT INTO public.developer_media_repair_attempts (developer_id, batch, outcome, note)
SELECT d.id, 14, 'no_authentic_source',
       'Batch 14: official site deep-crawl + rendered crawl + public directory returned only stock/people/interior imagery or no assets'
FROM public.developers d
WHERE (coalesce(d.logo_url_processed, d.logo_url, '') = '' OR coalesce(d.feature_image_url, '') = '')
  AND NOT EXISTS (
    SELECT 1 FROM public.developer_media_repair_attempts a
    WHERE a.developer_id = d.id AND a.batch = 14
  );