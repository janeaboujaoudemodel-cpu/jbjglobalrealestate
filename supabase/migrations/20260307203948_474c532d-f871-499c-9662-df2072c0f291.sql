CREATE TABLE public.enrichment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  total_projects int DEFAULT 0,
  processed int DEFAULT 0,
  images_added int DEFAULT 0,
  docs_added int DEFAULT 0,
  fields_updated int DEFAULT 0,
  errors int DEFAULT 0,
  stop_requested boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  log jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage enrichment jobs" ON public.enrichment_jobs
  FOR ALL TO authenticated USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);