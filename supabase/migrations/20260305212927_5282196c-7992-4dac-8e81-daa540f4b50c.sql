INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  true,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_upload_project_docs' AND tablename = 'objects') THEN
    CREATE POLICY "auth_upload_project_docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_project_docs' AND tablename = 'objects') THEN
    CREATE POLICY "public_read_project_docs" ON storage.objects FOR SELECT TO public USING (bucket_id = 'project-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_project_docs' AND tablename = 'objects') THEN
    CREATE POLICY "auth_delete_project_docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-documents');
  END IF;
END $$;