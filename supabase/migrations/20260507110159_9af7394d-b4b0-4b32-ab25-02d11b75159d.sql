
-- Extend crm_import_batches with specialty + source metadata
ALTER TABLE public.crm_import_batches
  ADD COLUMN IF NOT EXISTS specialty_label text,
  ADD COLUMN IF NOT EXISTS specialty_custom_label text,
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS upload_date timestamptz NOT NULL DEFAULT now();

-- Extend crm_brokerage_agents with registry/dedup fields
ALTER TABLE public.crm_brokerage_agents
  ADD COLUMN IF NOT EXISTS specialty_labels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_batch_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone_normalized text,
  ADD COLUMN IF NOT EXISTS whatsapp_normalized text,
  ADD COLUMN IF NOT EXISTS email_normalized text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS rera_number text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS first_imported_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS merge_history jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_owner_phone_norm
  ON public.crm_brokerage_agents(owner_id, phone_normalized) WHERE phone_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_owner_email_norm
  ON public.crm_brokerage_agents(owner_id, email_normalized) WHERE email_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_owner_license
  ON public.crm_brokerage_agents(owner_id, license_number) WHERE license_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_specialty
  ON public.crm_brokerage_agents USING GIN (specialty_labels);

-- Staging table for duplicate-review workflow
CREATE TABLE IF NOT EXISTS public.crm_broker_import_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized jsonb NOT NULL DEFAULT '{}'::jsonb,
  match_agent_id uuid,
  match_confidence numeric NOT NULL DEFAULT 0,
  match_reasons text[] NOT NULL DEFAULT '{}',
  decision text NOT NULL DEFAULT 'pending',
  edited jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_staging_batch ON public.crm_broker_import_staging(batch_id);
CREATE INDEX IF NOT EXISTS idx_broker_staging_owner ON public.crm_broker_import_staging(owner_id);

ALTER TABLE public.crm_broker_import_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own staging"
  ON public.crm_broker_import_staging FOR SELECT
  USING (auth.uid() = owner_id);
CREATE POLICY "Owner inserts own staging"
  ON public.crm_broker_import_staging FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates own staging"
  ON public.crm_broker_import_staging FOR UPDATE
  USING (auth.uid() = owner_id);
CREATE POLICY "Owner deletes own staging"
  ON public.crm_broker_import_staging FOR DELETE
  USING (auth.uid() = owner_id);

CREATE TRIGGER trg_broker_staging_updated_at
  BEFORE UPDATE ON public.crm_broker_import_staging
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
