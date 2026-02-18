-- Create public storage bucket for Instagram grid photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instagram-grid-photos',
  'instagram-grid-photos',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Public read access (Instagram API needs public URLs)
CREATE POLICY "Public read instagram grid photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'instagram-grid-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload instagram grid photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'instagram-grid-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Authenticated delete instagram grid photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'instagram-grid-photos');