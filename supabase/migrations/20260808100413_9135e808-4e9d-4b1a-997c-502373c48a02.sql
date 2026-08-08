-- Remove duplicate gallery rows inserted on 2026-08-08 for AMRA (project-media copies)
DELETE FROM public.project_images
WHERE project_id = 'b6e3de69-24d9-4401-b50b-f970d81a0b18'
  AND created_at >= '2026-08-08 00:00:00+00'
  AND image_url LIKE '%/public/project-media/%';

-- Restore cover to the owner's original upload (rel-media project-uploads)
UPDATE public.projects
SET cover_image_url = (
  SELECT image_url FROM public.project_images
  WHERE project_id = 'b6e3de69-24d9-4401-b50b-f970d81a0b18'
    AND image_url LIKE '%PHOTO-2026-03-05-15-35-46.jpg'
    AND image_url LIKE '%/public/rel-media/%'
  ORDER BY display_order
  LIMIT 1
)
WHERE id = 'b6e3de69-24d9-4401-b50b-f970d81a0b18'
  AND EXISTS (
    SELECT 1 FROM public.project_images
    WHERE project_id = 'b6e3de69-24d9-4401-b50b-f970d81a0b18'
      AND image_url LIKE '%PHOTO-2026-03-05-15-35-46.jpg'
      AND image_url LIKE '%/public/rel-media/%'
  );