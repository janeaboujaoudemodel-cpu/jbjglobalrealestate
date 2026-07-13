-- Replace unrestricted authenticated upload with per-user folder + extension allowlist
DROP POLICY IF EXISTS "Authenticated users can upload to listing-staging" ON storage.objects;

CREATE POLICY "listing_staging_user_scoped_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'listing-staging'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND lower(substring(name from '\.([^\.]+)$')) = ANY (ARRAY['pdf','png','jpg','jpeg','webp','doc','docx','xls','xlsx','csv','txt'])
);

CREATE POLICY "listing_staging_user_scoped_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'listing-staging'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'listing-staging'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "listing_staging_user_scoped_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'listing-staging'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "listing_staging_user_scoped_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'listing-staging'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);