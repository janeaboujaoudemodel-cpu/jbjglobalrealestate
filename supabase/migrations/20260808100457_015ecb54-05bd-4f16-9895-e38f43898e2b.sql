DELETE FROM public.project_images pi
USING (
  SELECT id,
         row_number() OVER (PARTITION BY project_id, image_url ORDER BY created_at, display_order, id) AS rn
  FROM public.project_images
) d
WHERE pi.id = d.id AND d.rn > 1;