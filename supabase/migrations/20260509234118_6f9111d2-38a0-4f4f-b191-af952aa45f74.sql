
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS office_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS admin_email text,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS registration_status text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS last_enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_source text;

ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS personal_phone text,
  ADD COLUMN IF NOT EXISTS company_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS experience_years integer,
  ADD COLUMN IF NOT EXISTS broker_type text CHECK (broker_type IN ('sales','leasing','both')),
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS bayut_url text,
  ADD COLUMN IF NOT EXISTS pf_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text;

CREATE INDEX IF NOT EXISTS crm_brokers_birthday_idx ON public.crm_brokers (birthday);
CREATE INDEX IF NOT EXISTS crm_brokers_broker_type_idx ON public.crm_brokers (broker_type);

CREATE TABLE IF NOT EXISTS public.birthday_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date date NOT NULL,
  audience_kind text NOT NULL,
  recipients_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_date, audience_kind)
);

ALTER TABLE public.birthday_workflow_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read birthday runs" ON public.birthday_workflow_runs;
CREATE POLICY "Owners read birthday runs"
  ON public.birthday_workflow_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
