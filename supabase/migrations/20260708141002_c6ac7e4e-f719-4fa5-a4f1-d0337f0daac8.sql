
-- 1. Developer documents (company profile PDFs etc.)
CREATE TABLE IF NOT EXISTS public.developer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'company_profile',
  file_url TEXT NOT NULL,
  file_name TEXT,
  storage_path TEXT,
  file_size BIGINT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  extracted_at TIMESTAMPTZ,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_developer_documents_developer ON public.developer_documents(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_documents_type ON public.developer_documents(doc_type);

GRANT SELECT ON public.developer_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_documents TO authenticated;
GRANT ALL ON public.developer_documents TO service_role;
ALTER TABLE public.developer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public developer documents"
  ON public.developer_documents FOR SELECT
  USING (is_public = true);

CREATE POLICY "Owners manage developer documents"
  ON public.developer_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

-- 2. Enrichment review drafts — AI-extracted fields awaiting owner approval
CREATE TABLE IF NOT EXISTS public.enrichment_review_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('developer','project')),
  target_id UUID NOT NULL,
  target_slug TEXT,
  source_document_id UUID,
  source_file_url TEXT,
  source_file_name TEXT,
  extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_snapshot JSONB DEFAULT '{}'::jsonb,
  ai_model TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','partial')),
  applied_fields TEXT[],
  skipped_fields TEXT[],
  error_message TEXT,
  created_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enrichment_drafts_status ON public.enrichment_review_drafts(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_drafts_target ON public.enrichment_review_drafts(target_type, target_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrichment_review_drafts TO authenticated;
GRANT ALL ON public.enrichment_review_drafts TO service_role;
ALTER TABLE public.enrichment_review_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage enrichment drafts"
  ON public.enrichment_review_drafts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

-- 3. Company profile requests from public visitors
CREATE TABLE IF NOT EXISTS public.company_profile_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  requester_name TEXT,
  requester_email TEXT,
  requester_phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_profile_requests_dev ON public.company_profile_requests(developer_id);

GRANT INSERT ON public.company_profile_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.company_profile_requests TO authenticated;
GRANT ALL ON public.company_profile_requests TO service_role;
ALTER TABLE public.company_profile_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a company profile"
  ON public.company_profile_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners view all profile requests"
  ON public.company_profile_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners update profile requests"
  ON public.company_profile_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

-- 4. Triggers for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_developer_documents_updated_at') THEN
    CREATE TRIGGER trg_developer_documents_updated_at
      BEFORE UPDATE ON public.developer_documents
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enrichment_drafts_updated_at') THEN
    CREATE TRIGGER trg_enrichment_drafts_updated_at
      BEFORE UPDATE ON public.enrichment_review_drafts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5. Storage policies for developer-profiles bucket
-- Owners upload/manage; authenticated (and via signed URLs, anon) read.
CREATE POLICY "Owners upload developer profile docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'developer-profiles' AND public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners update developer profile docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'developer-profiles' AND public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners delete developer profile docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'developer-profiles' AND public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Authenticated read developer profile docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'developer-profiles');
