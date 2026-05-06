
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS dld_office_number text,
  ADD COLUMN IF NOT EXISTS name_arabic text,
  ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS enrichment_attempts int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrichment_last_run_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS crm_brokerages_dld_office_number_key
  ON public.crm_brokerages (dld_office_number)
  WHERE dld_office_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS crm_brokerages_enrichment_status_idx
  ON public.crm_brokerages (enrichment_status)
  WHERE enrichment_status = 'pending';

CREATE INDEX IF NOT EXISTS crm_brokerages_company_name_lower_idx
  ON public.crm_brokerages (lower(company_name));
