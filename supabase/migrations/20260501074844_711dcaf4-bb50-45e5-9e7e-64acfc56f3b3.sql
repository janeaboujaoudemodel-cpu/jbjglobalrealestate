
-- 1. Private storage bucket for raw uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('ingestion-staging', 'ingestion-staging', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Extend material_ingestion_jobs
ALTER TABLE public.material_ingestion_jobs
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS page_count INTEGER,
  ADD COLUMN IF NOT EXISTS detected_doc_type TEXT,
  ADD COLUMN IF NOT EXISTS detected_developer_id UUID,
  ADD COLUMN IF NOT EXISTS detected_developer_name TEXT,
  ADD COLUMN IF NOT EXISTS developer_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS matched_project_id UUID,
  ADD COLUMN IF NOT EXISTS matched_project_name TEXT,
  ADD COLUMN IF NOT EXISTS match_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS merge_target JSONB,
  ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS merged_by UUID,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_kind TEXT;

CREATE INDEX IF NOT EXISTS idx_mij_status ON public.material_ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_mij_matched_project ON public.material_ingestion_jobs(matched_project_id);
CREATE INDEX IF NOT EXISTS idx_mij_detected_developer ON public.material_ingestion_jobs(detected_developer_id);

-- 3. project_videos
CREATE TABLE IF NOT EXISTS public.project_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  source_job_id UUID,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_videos_project ON public.project_videos(project_id, display_order);

ALTER TABLE public.project_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project videos viewable when visible"
  ON public.project_videos FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Owners and listing admins manage project videos - insert"
  ON public.project_videos FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  );

CREATE POLICY "Owners and listing admins manage project videos - update"
  ON public.project_videos FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  );

CREATE POLICY "Owners and listing admins manage project videos - delete"
  ON public.project_videos FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  );

CREATE POLICY "Owners and listing admins read all project videos"
  ON public.project_videos FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  );

CREATE TRIGGER update_project_videos_updated_at
  BEFORE UPDATE ON public.project_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. media_ingestion_audit
CREATE TABLE IF NOT EXISTS public.media_ingestion_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  target_table TEXT NOT NULL,
  target_row_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mia_job ON public.media_ingestion_audit(job_id);

ALTER TABLE public.media_ingestion_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and listing admins read media audit"
  ON public.media_ingestion_audit FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  );

CREATE POLICY "Owners and listing admins insert media audit"
  ON public.media_ingestion_audit FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  );

-- 5. Storage policies for ingestion-staging
CREATE POLICY "Owners and listing admins read ingestion-staging"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ingestion-staging'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'owner'::app_role)
      OR public.has_role(auth.uid(), 'listing_admin'::app_role)
    )
  );

CREATE POLICY "Owners and listing admins upload ingestion-staging"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ingestion-staging'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'owner'::app_role)
      OR public.has_role(auth.uid(), 'listing_admin'::app_role)
    )
  );

CREATE POLICY "Owners and listing admins update ingestion-staging"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ingestion-staging'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'owner'::app_role)
      OR public.has_role(auth.uid(), 'listing_admin'::app_role)
    )
  );

CREATE POLICY "Owners and listing admins delete ingestion-staging"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ingestion-staging'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'owner'::app_role)
      OR public.has_role(auth.uid(), 'listing_admin'::app_role)
    )
  );
