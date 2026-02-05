-- Create storage bucket for temporary video processing files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-processing-temp',
  'video-processing-temp',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "Anyone can upload to video-processing-temp"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'video-processing-temp');

CREATE POLICY "Anyone can read from video-processing-temp"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'video-processing-temp');

CREATE POLICY "Service role can delete from video-processing-temp"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'video-processing-temp');

-- Create a function to auto-delete old files (older than 2 hours)
CREATE OR REPLACE FUNCTION public.cleanup_temp_video_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Find files older than 2 hours in the temp bucket
  FOR file_record IN
    SELECT name 
    FROM storage.objects 
    WHERE bucket_id = 'video-processing-temp' 
    AND created_at < NOW() - INTERVAL '2 hours'
  LOOP
    -- Delete the file
    DELETE FROM storage.objects 
    WHERE bucket_id = 'video-processing-temp' 
    AND name = file_record.name;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.cleanup_temp_video_files() IS 'Removes video files older than 2 hours from the temp processing bucket. Should be called periodically via cron.';