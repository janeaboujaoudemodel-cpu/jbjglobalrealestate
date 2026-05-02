
ALTER TABLE public.material_ingestion_jobs
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS merge_mode text NOT NULL DEFAULT 'attach';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'material_ingestion_jobs' AND constraint_name = 'material_ingestion_jobs_merge_mode_check'
  ) THEN
    ALTER TABLE public.material_ingestion_jobs
      ADD CONSTRAINT material_ingestion_jobs_merge_mode_check
      CHECK (merge_mode IN ('attach','extract'));
  END IF;
END$$;

UPDATE storage.buckets
SET file_size_limit = 524288000,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'video/mp4','video/quicktime','video/webm','video/x-matroska',
      'image/jpeg','image/png','image/webp','image/gif',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
WHERE id = 'ingestion-staging';

INSERT INTO storage.buckets (id, name, public)
VALUES ('ingestion-archive', 'ingestion-archive', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owners and listing admins read ingestion-archive" ON storage.objects;
CREATE POLICY "Owners and listing admins read ingestion-archive"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ingestion-archive'
  AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'listing_admin'::app_role))
);

DROP POLICY IF EXISTS "Owners and listing admins upload ingestion-archive" ON storage.objects;
CREATE POLICY "Owners and listing admins upload ingestion-archive"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ingestion-archive'
  AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'listing_admin'::app_role))
);

DROP POLICY IF EXISTS "Owners and listing admins delete ingestion-archive" ON storage.objects;
CREATE POLICY "Owners and listing admins delete ingestion-archive"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ingestion-archive'
  AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'owner'::app_role) OR has_role(auth.uid(),'listing_admin'::app_role))
);
