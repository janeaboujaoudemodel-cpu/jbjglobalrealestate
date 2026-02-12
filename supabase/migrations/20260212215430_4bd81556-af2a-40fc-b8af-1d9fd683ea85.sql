
-- Cache table for AI developer analysis results
CREATE TABLE public.developer_ai_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_slug text UNIQUE NOT NULL,
  analysis_text text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developer_ai_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (public data)
CREATE POLICY "Anyone can read developer AI cache"
  ON public.developer_ai_cache
  FOR SELECT
  USING (true);
