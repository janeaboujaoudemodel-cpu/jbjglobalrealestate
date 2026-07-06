
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS last_enrichment_scan_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_fields text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS public.enrichment_scan_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name text,
  sources_checked text[] NOT NULL DEFAULT '{}'::text[],
  changed_keys text[] NOT NULL DEFAULT '{}'::text[],
  conflicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.enrichment_scan_log TO authenticated;
GRANT ALL ON public.enrichment_scan_log TO service_role;

ALTER TABLE public.enrichment_scan_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read enrichment scan log" ON public.enrichment_scan_log;
CREATE POLICY "Owners read enrichment scan log"
  ON public.enrichment_scan_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_enrichment_scan_log_run ON public.enrichment_scan_log(run_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_scan_log_project ON public.enrichment_scan_log(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_last_enrichment_scan_at ON public.projects(last_enrichment_scan_at NULLS FIRST) WHERE is_published = true;
