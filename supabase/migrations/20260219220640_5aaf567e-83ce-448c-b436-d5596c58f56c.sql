-- Create project-media storage bucket for offline Reelly image mirroring
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-media', 'project-media', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read project-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-media');

-- Allow service role to upload
CREATE POLICY "Service role upload project-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-media');

CREATE POLICY "Service role update project-media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-media');

CREATE POLICY "Service role delete project-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-media');