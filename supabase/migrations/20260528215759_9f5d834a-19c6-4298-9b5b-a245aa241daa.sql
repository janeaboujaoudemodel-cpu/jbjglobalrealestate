-- 1. Private storage bucket for broker call recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-recordings',
  'call-recordings',
  false,
  104857600, -- 100MB
  ARRAY['audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/m4a']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies on storage.objects for this bucket
DROP POLICY IF EXISTS "Brokers can read own call recordings" ON storage.objects;
CREATE POLICY "Brokers can read own call recordings"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Brokers can upload own call recordings" ON storage.objects;
CREATE POLICY "Brokers can upload own call recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'call-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Brokers can update own call recordings" ON storage.objects;
CREATE POLICY "Brokers can update own call recordings"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Brokers can delete own call recordings" ON storage.objects;
CREATE POLICY "Brokers can delete own call recordings"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Owners can read all call recordings" ON storage.objects;
CREATE POLICY "Owners can read all call recordings"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND public.has_role(auth.uid(), 'admin')
);

-- 3. AI columns on broker_call_logs
ALTER TABLE public.broker_call_logs
  ADD COLUMN IF NOT EXISTS transcript_text TEXT,
  ADD COLUMN IF NOT EXISTS transcript_segments JSONB,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_next_step TEXT,
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_matches JSONB,
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;