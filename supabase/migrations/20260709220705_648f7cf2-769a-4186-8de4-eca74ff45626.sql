
DROP POLICY IF EXISTS "Authenticated read developer profile docs" ON storage.objects;

CREATE POLICY "Owners and admins read developer profile docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'developer-profiles'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
  )
);
