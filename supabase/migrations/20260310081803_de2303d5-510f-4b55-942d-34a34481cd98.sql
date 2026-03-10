
-- Add lead_id column to admin_tasks
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL;

-- Ensure documents storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own task-attachments path
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'task-attachments' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);

-- RLS: authenticated users can read their own task attachments
CREATE POLICY "Users can read own task attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'task-attachments' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);

-- RLS: public read for documents bucket (since it's public)
CREATE POLICY "Public read for documents"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'documents');
