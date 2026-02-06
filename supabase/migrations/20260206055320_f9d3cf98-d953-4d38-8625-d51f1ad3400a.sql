-- =============================================
-- FIX VIDEO-PROCESSING-TEMP STORAGE SECURITY
-- =============================================

-- 1. Make bucket PRIVATE (disable public access)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'video-processing-temp';

-- 2. Drop insecure "anyone" policies
DROP POLICY IF EXISTS "Anyone can read from video-processing-temp" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to video-processing-temp" ON storage.objects;

-- 3. Create OWNERSHIP-BASED policies using the new path structure
-- Path convention: video-export/{userId}/{jobId}/...

-- Users can upload to their own folders only
CREATE POLICY "Users can upload to own video-export folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'video-processing-temp' 
  AND (storage.foldername(name))[1] = 'video-export'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can read their own files only
CREATE POLICY "Users can read own video-export files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'video-processing-temp' 
  AND (storage.foldername(name))[1] = 'video-export'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can update their own files only
CREATE POLICY "Users can update own video-export files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'video-processing-temp' 
  AND (storage.foldername(name))[1] = 'video-export'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'video-processing-temp' 
  AND (storage.foldername(name))[1] = 'video-export'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can delete their own files only
CREATE POLICY "Users can delete own video-export files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'video-processing-temp' 
  AND (storage.foldername(name))[1] = 'video-export'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Keep service role delete policy for cleanup jobs
-- (Already exists, just verify it works with private bucket)