
ALTER TABLE public.projects DISABLE TRIGGER USER;

UPDATE public.projects
SET is_published = true
WHERE cover_image_url IS NOT NULL AND cover_image_url <> ''
  AND (is_published IS NULL OR is_published = false);

ALTER TABLE public.projects ENABLE TRIGGER USER;
