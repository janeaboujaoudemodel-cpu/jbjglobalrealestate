
INSERT INTO storage.buckets (id, name, public) VALUES ('consent-documents', 'consent-documents', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload consent docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'consent-documents' AND (storage.foldername(name))[1] = 'consent-ids');

CREATE POLICY "Users can view own consent docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'consent-documents' AND auth.uid()::text = (storage.foldername(name))[2]);
