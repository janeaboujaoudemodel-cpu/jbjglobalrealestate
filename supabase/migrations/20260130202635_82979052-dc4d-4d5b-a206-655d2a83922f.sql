-- Only authenticated admins can upload voice samples
CREATE POLICY "Admins can upload voice samples"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-samples' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- Only admins can view voice samples
CREATE POLICY "Admins can view voice samples"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-samples'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- Only admins can delete voice samples
CREATE POLICY "Admins can delete voice samples"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-samples'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_role = 'admin'
  )
);