-- Create voice-samples storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-samples', 'voice-samples', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to voice samples
CREATE POLICY "Public can view voice samples"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-samples');

-- Allow authenticated users to upload voice samples
CREATE POLICY "Authenticated users can upload voice samples"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-samples');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete voice samples"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'voice-samples');