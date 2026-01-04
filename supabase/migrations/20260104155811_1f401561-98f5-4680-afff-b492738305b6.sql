-- Add RLS policies for storage bucket so only admins can upload/modify/delete files

-- Policy for admins to upload files
CREATE POLICY "Admins can upload project files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'project-files' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy for admins to update files
CREATE POLICY "Admins can update project files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'project-files' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy for admins to delete files
CREATE POLICY "Admins can delete project files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'project-files' 
  AND public.has_role(auth.uid(), 'admin')
);