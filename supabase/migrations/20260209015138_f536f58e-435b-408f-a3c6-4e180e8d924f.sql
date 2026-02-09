-- Create storage bucket for developer logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'developer-logos',
  'developer-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/webp', 'image/jpeg', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to developer logos
CREATE POLICY "Public read access for developer logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'developer-logos');

-- Allow service role to upload
CREATE POLICY "Service role can upload developer logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'developer-logos');

-- Allow service role to update
CREATE POLICY "Service role can update developer logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'developer-logos');