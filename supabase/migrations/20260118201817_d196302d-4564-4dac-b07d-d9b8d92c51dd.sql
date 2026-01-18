-- Create storage bucket for assistant files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assistant-files', 
  'assistant-files', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/*', 'video/*', 'audio/*']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload assistant files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assistant-files' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow authenticated users to view their files
CREATE POLICY "Users can view their own assistant files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assistant-files' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow public access to view files (for sharing)
CREATE POLICY "Public can view assistant files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'assistant-files');

-- Create table to store internal chat messages
CREATE TABLE IF NOT EXISTS public.internal_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own chat messages"
ON public.internal_chat_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own chat messages"
ON public.internal_chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_internal_chat_user_employee ON public.internal_chat_messages(user_id, employee_id);