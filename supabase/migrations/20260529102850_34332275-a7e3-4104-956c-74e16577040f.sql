DROP POLICY IF EXISTS "Owners can read all call recordings" ON storage.objects;
CREATE POLICY "Owners can read all call recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  )
);