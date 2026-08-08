ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS logo_needs_invert boolean;
ALTER TABLE public.dev_media_import ADD COLUMN IF NOT EXISTS needs_invert boolean;