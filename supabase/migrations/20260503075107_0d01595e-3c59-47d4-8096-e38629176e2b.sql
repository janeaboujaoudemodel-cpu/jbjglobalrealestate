ALTER TABLE public.material_ingestion_jobs
  ALTER COLUMN source_url DROP NOT NULL;

ALTER TABLE public.material_ingestion_jobs
  DROP CONSTRAINT IF EXISTS mij_source_or_file_required;

ALTER TABLE public.material_ingestion_jobs
  ADD CONSTRAINT mij_source_or_file_required
  CHECK (source_url IS NOT NULL OR file_path IS NOT NULL OR status IN ('pending','processing','queued'));