-- Create storage bucket for HR documents (CVs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for hr-documents bucket
-- Users can upload their own CV
CREATE POLICY "hr_documents_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hr-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own documents
CREATE POLICY "hr_documents_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'hr-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own documents
CREATE POLICY "hr_documents_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'hr-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all HR documents
CREATE POLICY "hr_documents_admin_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'hr-documents' 
    AND public.is_hr_admin(auth.uid())
  );