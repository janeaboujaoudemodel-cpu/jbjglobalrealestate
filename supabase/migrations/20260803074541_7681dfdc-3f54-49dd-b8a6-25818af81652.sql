INSERT INTO public.project_images (project_id, image_url, alt_text, display_order, data_source, asset_role)
SELECT '9a7e228e-7023-42eb-8b90-1dcd86698049', s.image_url, 'ARYA Residences – official render', 100 + row_number() over (order by s.display_order), 'twin_record_sync', 'gallery'
FROM public.project_images s
WHERE s.project_id = '898c26d1-a22b-4c58-b802-65853609c885'
  AND s.asset_role = 'gallery'
  AND s.image_url LIKE '%/i/%'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_images t
    WHERE t.project_id = '9a7e228e-7023-42eb-8b90-1dcd86698049' AND t.image_url = s.image_url
  );

INSERT INTO public.project_images (project_id, image_url, alt_text, display_order, data_source, asset_role)
SELECT 'd37d6d63-bb7c-458b-9fb8-50574c7291e2', s.image_url, 'AGUA Residences – official render', 100 + row_number() over (order by s.display_order), 'twin_record_sync', 'gallery'
FROM public.project_images s
WHERE s.project_id = '36517cf3-bcab-436e-9f99-e5ff0de05ddd'
  AND s.asset_role = 'gallery'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_images t
    WHERE t.project_id = 'd37d6d63-bb7c-458b-9fb8-50574c7291e2' AND t.image_url = s.image_url
  );