-- crm_documents: structured document instances (PAA + future templates)
CREATE TABLE IF NOT EXISTS public.crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  template_id text NOT NULL DEFAULT 'jbj-property-advertising-agreement',
  title text NOT NULL DEFAULT 'Untitled Document',
  status text NOT NULL DEFAULT 'draft',
  field_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_html text,
  pdf_path text,
  client_lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  client_name text,
  client_email text,
  client_phone text,
  recipient_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  signature_asset_id uuid,
  stamp_asset_id uuid,
  signature_data_url text,
  client_signature_data_url text,
  sent_at timestamptz,
  opened_at timestamptz,
  filled_at timestamptz,
  signed_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_documents_status_chk CHECK (status IN ('draft','sent','opened','filled','signed','completed','expired','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_crm_documents_owner ON public.crm_documents(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_documents_status ON public.crm_documents(status);
CREATE INDEX IF NOT EXISTS idx_crm_documents_token ON public.crm_documents(recipient_token);

ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own documents"
  ON public.crm_documents FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners insert own documents"
  ON public.crm_documents FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners update own documents"
  ON public.crm_documents FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners delete own documents"
  ON public.crm_documents FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE TRIGGER trg_crm_documents_updated_at
  BEFORE UPDATE ON public.crm_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public fetch by token (security definer, no PII leak)
CREATE OR REPLACE FUNCTION public.get_document_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  template_id text,
  title text,
  status text,
  field_values jsonb,
  rendered_html text,
  client_name text,
  expires_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, template_id, title, status, field_values, rendered_html, client_name, expires_at
  FROM public.crm_documents
  WHERE recipient_token = p_token
    AND status NOT IN ('completed','expired','cancelled')
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_document_by_token(text) TO anon, authenticated;

-- Storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-documents', 'crm-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owners read own crm-documents files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crm-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners upload to own crm-documents folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'crm-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners update own crm-documents files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'crm-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
