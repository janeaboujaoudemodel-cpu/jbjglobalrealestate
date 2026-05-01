UPDATE public.projects
SET is_published = false,
    updated_at = now()
WHERE is_published = true
  AND nullif(trim(coalesce(cover_image_url, '')), '') IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.project_images pi
    WHERE pi.project_id = projects.id
      AND nullif(trim(coalesce(pi.image_url, '')), '') IS NOT NULL
  );