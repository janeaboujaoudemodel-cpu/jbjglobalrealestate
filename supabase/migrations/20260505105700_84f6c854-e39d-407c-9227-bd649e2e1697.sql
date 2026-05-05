
-- External Agreements table
CREATE TABLE public.external_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  developer_name_raw TEXT,
  contract_type TEXT,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  effective_date DATE,
  expiry_date DATE,
  commission_pct NUMERIC,
  counterparties JSONB DEFAULT '[]'::jsonb,
  ai_confidence NUMERIC,
  ai_extracted JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review',
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_external_agreements_developer ON public.external_agreements(developer_id);
CREATE INDEX idx_external_agreements_owner ON public.external_agreements(owner_user_id);
CREATE INDEX idx_external_agreements_status ON public.external_agreements(status);

ALTER TABLE public.external_agreements ENABLE ROW LEVEL SECURITY;

-- Reuse has_role(); restrict to owner role
CREATE POLICY "Owners can view all agreements"
  ON public.external_agreements FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can insert agreements"
  ON public.external_agreements FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) AND auth.uid() = owner_user_id);

CREATE POLICY "Owners can update agreements"
  ON public.external_agreements FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete agreements"
  ON public.external_agreements FOR DELETE
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- updated_at trigger
CREATE TRIGGER trg_external_agreements_updated_at
  BEFORE UPDATE ON public.external_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('developer-agreements', 'developer-agreements', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: owner-only
CREATE POLICY "Owners can read developer agreement files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'developer-agreements' AND public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can upload developer agreement files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'developer-agreements' AND public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update developer agreement files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'developer-agreements' AND public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete developer agreement files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'developer-agreements' AND public.has_role(auth.uid(), 'owner'::app_role));
