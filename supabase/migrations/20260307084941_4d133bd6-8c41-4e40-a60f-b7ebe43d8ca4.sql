-- Create staging bucket for listing generator file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-staging', 'listing-staging', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to listing-staging
CREATE POLICY "Authenticated users can upload to listing-staging"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-staging');

-- Allow public read access for edge functions to fetch files
CREATE POLICY "Public read access for listing-staging"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'listing-staging');

-- Allow authenticated users to delete their own staging files
CREATE POLICY "Users can delete own staging files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-staging' AND (storage.foldername(name))[1] = auth.uid()::text);