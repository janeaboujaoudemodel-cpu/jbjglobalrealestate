-- Create translation cache table
CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text TEXT NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_text, target_lang)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup 
  ON public.translation_cache(target_lang, source_text);

-- Enable RLS (allow public read, service role write)
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read translations (cached content is public)
CREATE POLICY "Allow public read access to translation cache"
  ON public.translation_cache
  FOR SELECT
  USING (true);

-- Only service role can insert/update (via edge function)
CREATE POLICY "Allow service role to manage translations"
  ON public.translation_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');