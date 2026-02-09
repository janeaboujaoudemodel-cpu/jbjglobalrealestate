-- Create storage bucket for interior design outputs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interior-designs',
  'interior-designs',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- RLS: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own interior designs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'interior-designs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Anyone can view interior designs (public bucket)
CREATE POLICY "Anyone can view interior designs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'interior-designs');

-- RLS: Users can delete their own designs
CREATE POLICY "Users can delete their own interior designs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'interior-designs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);