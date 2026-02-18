
-- Add favorites and Arabic fields to stamp tables
ALTER TABLE stamp_designs ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE stamp_projects ADD COLUMN IF NOT EXISTS arabic_company_name TEXT;
ALTER TABLE stamp_projects ADD COLUMN IF NOT EXISTS arabic_city TEXT;

-- E-Sign system tables (JBJ DocuSign replacement)
-- Note: esign_envelopes, esign_recipients, esign_fields, esign_audit_log already exist from previous migration
-- Add toolkit-facing e-sign documents table if not already present
CREATE TABLE IF NOT EXISTS public.esign_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.esign_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'esign_documents' AND policyname = 'Users manage own documents') THEN
    CREATE POLICY "Users manage own documents" ON public.esign_documents
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
