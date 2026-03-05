
-- Create storage bucket for project documents (brochures, floor plans, payment plans)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-documents', 'project-documents', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can upload project docs" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "Public can read project docs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-documents');

CREATE POLICY "Service role can update project docs" ON storage.objects
  FOR UPDATE TO service_role
  USING (bucket_id = 'project-documents');
