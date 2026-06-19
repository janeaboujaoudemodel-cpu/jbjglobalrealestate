-- Replace the over-broad upload policy on consent-documents so users can only
-- write into their own folder (consent-ids/<auth.uid()>/...).
DROP POLICY IF EXISTS "Users can upload consent docs" ON storage.objects;

CREATE POLICY "Users can upload own consent docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'consent-documents'
    AND (storage.foldername(name))[1] = 'consent-ids'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );