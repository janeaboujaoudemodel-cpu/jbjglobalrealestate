-- Create storage bucket for podcast audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('podcast-audio', 'podcast-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to podcast audio
CREATE POLICY "Podcast audio is publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'podcast-audio');

-- Allow edge functions to upload audio (service role)
CREATE POLICY "Service role can upload podcast audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'podcast-audio');

CREATE POLICY "Service role can update podcast audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'podcast-audio');

-- Table to track which segments have been generated
CREATE TABLE IF NOT EXISTS public.podcast_audio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id INTEGER NOT NULL,
  segment_index INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(episode_id, segment_index, language, text_hash)
);

-- Public read access (no auth needed)
ALTER TABLE public.podcast_audio_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read podcast cache"
ON public.podcast_audio_cache FOR SELECT
USING (true);