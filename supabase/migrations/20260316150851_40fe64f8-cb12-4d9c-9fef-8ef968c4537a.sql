
-- Add verification columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none';

-- Create user_verifications table
CREATE TABLE public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  id_document_url text,
  selfie_url text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on user_verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own verification requests
CREATE POLICY "Users can insert own verification" ON public.user_verifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own verification requests
CREATE POLICY "Users can view own verification" ON public.user_verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Owner/admin can view all verification requests
CREATE POLICY "Owner can view all verifications" ON public.user_verifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Owner/admin can update verification requests (approve/reject)
CREATE POLICY "Owner can update verifications" ON public.user_verifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Create private storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users upload own verification docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: users can view their own documents
CREATE POLICY "Users view own verification docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: admin/owner can view all verification documents
CREATE POLICY "Admin view all verification docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')));
