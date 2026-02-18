
-- Add certificate_url column to esign_signed_documents if it doesn't exist
ALTER TABLE public.esign_signed_documents
  ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Ensure esign-certificates bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('esign-certificates', 'esign-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can read (public bucket)
CREATE POLICY "esign_certs_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'esign-certificates');

-- Storage policy: service role can insert
CREATE POLICY "esign_certs_service_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'esign-certificates');
