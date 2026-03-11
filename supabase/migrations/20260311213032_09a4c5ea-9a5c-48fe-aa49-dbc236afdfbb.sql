-- Create broker-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('broker-documents', 'broker-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Brokers can upload own docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'broker-documents'
  AND (storage.foldername(name))[1] = 'broker-docs'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to read their own docs
CREATE POLICY "Brokers can read own docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'broker-documents'
  AND (storage.foldername(name))[1] = 'broker-docs'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read for broker documents (public bucket)
CREATE POLICY "Public can read broker docs"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'broker-documents');