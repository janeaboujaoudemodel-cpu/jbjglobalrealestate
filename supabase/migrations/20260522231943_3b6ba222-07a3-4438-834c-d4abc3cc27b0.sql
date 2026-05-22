
-- 1. Staged scraped projects
CREATE TABLE IF NOT EXISTS public.developer_scraped_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text,
  image_url text,
  project_status text NOT NULL DEFAULT 'completed',
  scraped_at timestamptz NOT NULL DEFAULT now(),
  source_url text
);
CREATE INDEX IF NOT EXISTS idx_dev_scraped_projects_dev ON public.developer_scraped_projects(developer_id);

ALTER TABLE public.developer_scraped_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view scraped projects" ON public.developer_scraped_projects;
CREATE POLICY "Owners can view scraped projects"
  ON public.developer_scraped_projects FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owners can insert scraped projects" ON public.developer_scraped_projects;
CREATE POLICY "Owners can insert scraped projects"
  ON public.developer_scraped_projects FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owners can delete scraped projects" ON public.developer_scraped_projects;
CREATE POLICY "Owners can delete scraped projects"
  ON public.developer_scraped_projects FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 2. Enum + extend existing developer_enrichment_log
DO $$ BEGIN
  CREATE TYPE public.developer_enrichment_status AS ENUM ('staged','approved','rejected','applied','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.developer_enrichment_log
  ADD COLUMN IF NOT EXISTS before_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS after_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS status public.developer_enrichment_status NOT NULL DEFAULT 'staged',
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS applied_by uuid;

CREATE INDEX IF NOT EXISTS idx_dev_enrich_log_status ON public.developer_enrichment_log(status);

DROP POLICY IF EXISTS "Owners can update enrichment log" ON public.developer_enrichment_log;
CREATE POLICY "Owners can update enrichment log"
  ON public.developer_enrichment_log FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 3. Fix cross-wired descriptions (Binghatti got Habtoor text; Samana got Binghatti text)
UPDATE public.developers
SET description = NULL,
    last_enriched_at = NULL,
    enrichment_source = 'cleared_2026_05_22_crosswire_fix'
WHERE slug IN ('binghatti', 'developed-by-binghatti', 'samana-developers');
