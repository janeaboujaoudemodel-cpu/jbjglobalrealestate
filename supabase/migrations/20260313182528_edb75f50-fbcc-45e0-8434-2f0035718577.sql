ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS card_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_start_image_url text;

COMMENT ON COLUMN public.projects.card_image_url IS 'Image shown on listing cards externally';
COMMENT ON COLUMN public.projects.gallery_start_image_url IS 'First image shown in the project gallery';
COMMENT ON COLUMN public.projects.cover_image_url IS 'Hero/cover image shown on project detail page';