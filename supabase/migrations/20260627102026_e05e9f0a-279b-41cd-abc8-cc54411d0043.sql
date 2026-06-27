ALTER TABLE public.crm_documents
  ADD COLUMN IF NOT EXISTS candidate_folder text,
  ADD COLUMN IF NOT EXISTS candidate_display_name text;

CREATE INDEX IF NOT EXISTS crm_documents_candidate_folder_idx
  ON public.crm_documents (owner_user_id, candidate_folder);

CREATE TABLE IF NOT EXISTS public.crm_document_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  candidate_folder text NOT NULL,
  candidate_display_name text,
  file_path text NOT NULL,
  mime_type text,
  original_filename text,
  kind text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_document_attachments TO authenticated;
GRANT ALL ON public.crm_document_attachments TO service_role;

ALTER TABLE public.crm_document_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own attachments"
  ON public.crm_document_attachments FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "Owner can insert own attachments"
  ON public.crm_document_attachments FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner can update own attachments"
  ON public.crm_document_attachments FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner can delete own attachments"
  ON public.crm_document_attachments FOR DELETE
  USING (owner_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS crm_document_attachments_folder_idx
  ON public.crm_document_attachments (owner_user_id, candidate_folder);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_attachments_touch ON public.crm_document_attachments;
CREATE TRIGGER trg_attachments_touch BEFORE UPDATE ON public.crm_document_attachments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.purge_old_deleted_documents()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.crm_documents
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
  DELETE FROM public.crm_document_attachments
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
END $$;

DROP POLICY IF EXISTS "Owner reads own candidate docs" ON storage.objects;
CREATE POLICY "Owner reads own candidate docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owner uploads own candidate docs" ON storage.objects;
CREATE POLICY "Owner uploads own candidate docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owner updates own candidate docs" ON storage.objects;
CREATE POLICY "Owner updates own candidate docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owner deletes own candidate docs" ON storage.objects;
CREATE POLICY "Owner deletes own candidate docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);