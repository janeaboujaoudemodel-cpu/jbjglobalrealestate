-- Extend crm_leads with the unified Leads & Clients fields
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS whatsapp_e164 text,
  ADD COLUMN IF NOT EXISTS country_of_residence text,
  ADD COLUMN IF NOT EXISTS budget_min numeric,
  ADD COLUMN IF NOT EXISTS budget_max numeric,
  ADD COLUMN IF NOT EXISTS budget_currency text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS preferred_location text,
  ADD COLUMN IF NOT EXISTS preferred_project text,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS bedroom_requirement text,
  ADD COLUMN IF NOT EXISTS buying_purpose text,
  ADD COLUMN IF NOT EXISTS lead_type text,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS lead_score_band text,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_comments text,
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Helpful indexes for the new filterable fields
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_type ON public.crm_leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_crm_leads_priority ON public.crm_leads(priority);
CREATE INDEX IF NOT EXISTS idx_crm_leads_score_band ON public.crm_leads(lead_score_band);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_followup ON public.crm_leads(next_followup_at);

-- Storage bucket for per-lead document attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-documents', 'lead-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: each user can only manage files inside their own user_id folder
DROP POLICY IF EXISTS "Lead docs: read own" ON storage.objects;
CREATE POLICY "Lead docs: read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lead-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Lead docs: insert own" ON storage.objects;
CREATE POLICY "Lead docs: insert own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lead-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Lead docs: update own" ON storage.objects;
CREATE POLICY "Lead docs: update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'lead-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Lead docs: delete own" ON storage.objects;
CREATE POLICY "Lead docs: delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lead-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );