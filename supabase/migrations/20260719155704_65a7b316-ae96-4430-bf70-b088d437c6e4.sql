
-- Specialty split for brokerages + brokers
DO $$ BEGIN
  CREATE TYPE public.broker_specialty AS ENUM ('secondary','offplan','both');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.broker_specialty_focus AS ENUM ('secondary_first','offplan_first','equal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS specialty public.broker_specialty,
  ADD COLUMN IF NOT EXISTS specialty_focus public.broker_specialty_focus,
  ADD COLUMN IF NOT EXISTS dld_license_number text,
  ADD COLUMN IF NOT EXISTS dld_first_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS dld_last_synced_at timestamptz;

ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS specialty_choice public.broker_specialty,
  ADD COLUMN IF NOT EXISTS specialty_focus public.broker_specialty_focus,
  ADD COLUMN IF NOT EXISTS dld_card_number text,
  ADD COLUMN IF NOT EXISTS dld_first_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS dld_last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_specialty ON public.crm_brokerages(specialty);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_specialty ON public.crm_brokers(specialty_choice);
CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_brokerages_dld_license ON public.crm_brokerages(dld_license_number) WHERE dld_license_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_brokers_dld_card ON public.crm_brokers(dld_card_number) WHERE dld_card_number IS NOT NULL;

-- DLD daily sync run log
CREATE TABLE IF NOT EXISTS public.dld_daily_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_started_at timestamptz NOT NULL DEFAULT now(),
  run_finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  agencies_inserted int NOT NULL DEFAULT 0,
  agencies_updated int NOT NULL DEFAULT 0,
  brokers_inserted int NOT NULL DEFAULT 0,
  brokers_updated int NOT NULL DEFAULT 0,
  error_message text,
  raw_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.dld_daily_sync_runs TO authenticated;
GRANT ALL ON public.dld_daily_sync_runs TO service_role;
ALTER TABLE public.dld_daily_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view DLD sync runs"
  ON public.dld_daily_sync_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
