
-- Fix launch_interest_registrations RLS: replace auth.users reference with owner UUID
DROP POLICY IF EXISTS "Owner can view all interest" ON public.launch_interest_registrations;
CREATE POLICY "Owner can view all interest" ON public.launch_interest_registrations
  FOR SELECT TO authenticated
  USING (auth.uid() = '4944592b-93f1-4e05-ab59-4ebe1fee54f1'::uuid OR user_id = auth.uid());

-- Storage: allow authenticated users to upload to documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload documents"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can update documents"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'documents');
  END IF;
END $$;
