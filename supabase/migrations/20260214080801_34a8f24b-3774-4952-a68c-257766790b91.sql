CREATE TABLE public.project_ai_cache (
  project_slug text PRIMARY KEY,
  analysis_json jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read project AI cache"
ON public.project_ai_cache FOR SELECT USING (true);

CREATE POLICY "Service role can manage project AI cache"
ON public.project_ai_cache FOR ALL USING (true) WITH CHECK (true);