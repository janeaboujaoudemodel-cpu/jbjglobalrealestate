-- Expertise + batch tagging on brokers
ALTER TABLE public.crm_brokerage_agents
  ADD COLUMN IF NOT EXISTS expertise_type text NOT NULL DEFAULT 'both' CHECK (expertise_type IN ('leasing','selling','both')),
  ADD COLUMN IF NOT EXISTS expertise_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS import_label text;

ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS expertise_type text NOT NULL DEFAULT 'both' CHECK (expertise_type IN ('leasing','selling','both')),
  ADD COLUMN IF NOT EXISTS expertise_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS import_label text;

CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_batch ON public.crm_brokerage_agents(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_batch ON public.crm_brokerages(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_expertise ON public.crm_brokerage_agents(expertise_type);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_expertise ON public.crm_brokerages(expertise_type);

-- Import batch tracker
CREATE TABLE IF NOT EXISTS public.crm_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  target text NOT NULL CHECK (target IN ('brokers','brokerages')),
  label text NOT NULL,
  strategy text NOT NULL DEFAULT 'merge' CHECK (strategy IN ('merge','separate','append')),
  default_expertise_type text NOT NULL DEFAULT 'both' CHECK (default_expertise_type IN ('leasing','selling','both')),
  default_expertise_areas text[] NOT NULL DEFAULT '{}',
  row_count integer NOT NULL DEFAULT 0,
  inserted integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  source_filename text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view their import batches" ON public.crm_import_batches;
CREATE POLICY "Owner can view their import batches" ON public.crm_import_batches
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner can insert import batches" ON public.crm_import_batches;
CREATE POLICY "Owner can insert import batches" ON public.crm_import_batches
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner can update their import batches" ON public.crm_import_batches;
CREATE POLICY "Owner can update their import batches" ON public.crm_import_batches
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner can delete their import batches" ON public.crm_import_batches;
CREATE POLICY "Owner can delete their import batches" ON public.crm_import_batches
  FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_crm_import_batches_owner ON public.crm_import_batches(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_import_batches_target ON public.crm_import_batches(target);

DROP TRIGGER IF EXISTS update_crm_import_batches_updated_at ON public.crm_import_batches;
CREATE TRIGGER update_crm_import_batches_updated_at
  BEFORE UPDATE ON public.crm_import_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();