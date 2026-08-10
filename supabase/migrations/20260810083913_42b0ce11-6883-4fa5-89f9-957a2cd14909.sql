ALTER TABLE public.developer_media ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

UPDATE public.developer_media SET is_public = true WHERE kind = 'photo' AND uploaded_by IS NULL;

GRANT SELECT ON public.developer_media TO anon;

CREATE POLICY "dev_media_public_photos_read"
ON public.developer_media
FOR SELECT
TO anon, authenticated
USING (kind = 'photo' AND is_public = true);