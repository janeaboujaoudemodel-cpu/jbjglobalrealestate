
-- DLD daily sync: staging + conflicts + normalized-key indexes + cron enablement
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─────────────────────────────────────────────────────────────
-- Staging: raw rows scraped nightly, keyed by source URL + row hash
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dld_scrape_staging_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  developer_no TEXT,
  name_en TEXT,
  name_ar TEXT,
  license_no TEXT,
  phone TEXT,
  email TEXT,
  status TEXT,
  raw_row JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingest_status TEXT NOT NULL DEFAULT 'pending' CHECK (ingest_status IN ('pending','inserted','skipped_exact','flagged_conflict','error')),
  ingest_note TEXT,
  ingested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dld_scrape_staging_developers TO authenticated;
GRANT ALL ON public.dld_scrape_staging_developers TO service_role;
ALTER TABLE public.dld_scrape_staging_developers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read staging developers" ON public.dld_scrape_staging_developers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_stg_dev_run ON public.dld_scrape_staging_developers(run_id);
CREATE INDEX IF NOT EXISTS idx_stg_dev_status ON public.dld_scrape_staging_developers(ingest_status);

CREATE TABLE IF NOT EXISTS public.dld_scrape_staging_brokerages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  office_no TEXT,
  name_en TEXT,
  name_ar TEXT,
  manager TEXT,
  phone TEXT,
  email TEXT,
  area TEXT,
  license_expiry DATE,
  raw_row JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingest_status TEXT NOT NULL DEFAULT 'pending' CHECK (ingest_status IN ('pending','inserted','skipped_exact','flagged_conflict','error')),
  ingest_note TEXT,
  ingested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dld_scrape_staging_brokerages TO authenticated;
GRANT ALL ON public.dld_scrape_staging_brokerages TO service_role;
ALTER TABLE public.dld_scrape_staging_brokerages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read staging brokerages" ON public.dld_scrape_staging_brokerages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_stg_brk_run ON public.dld_scrape_staging_brokerages(run_id);
CREATE INDEX IF NOT EXISTS idx_stg_brk_status ON public.dld_scrape_staging_brokerages(ingest_status);

CREATE TABLE IF NOT EXISTS public.dld_scrape_staging_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  broker_no TEXT,
  name_en TEXT,
  name_ar TEXT,
  office_name TEXT,
  mobile TEXT,
  email TEXT,
  license_category TEXT, -- All / Sale / Lease / Mortgage / Nationals / Group A
  area TEXT,
  license_expiry DATE,
  raw_row JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingest_status TEXT NOT NULL DEFAULT 'pending' CHECK (ingest_status IN ('pending','inserted','skipped_exact','flagged_conflict','error')),
  ingest_note TEXT,
  ingested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dld_scrape_staging_brokers TO authenticated;
GRANT ALL ON public.dld_scrape_staging_brokers TO service_role;
ALTER TABLE public.dld_scrape_staging_brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read staging brokers" ON public.dld_scrape_staging_brokers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_stg_brok_run ON public.dld_scrape_staging_brokers(run_id);
CREATE INDEX IF NOT EXISTS idx_stg_brok_status ON public.dld_scrape_staging_brokers(ingest_status);

-- ─────────────────────────────────────────────────────────────
-- Conflicts: partial matches flagged for owner review (no auto-update)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dld_scrape_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL CHECK (segment IN ('developer','brokerage','broker')),
  live_table TEXT NOT NULL,
  live_row_id UUID NOT NULL,
  staging_table TEXT NOT NULL,
  staging_row_id UUID NOT NULL,
  match_type TEXT NOT NULL, -- e.g. 'name+email,phone_diff', 'name+phone,email_diff'
  live_snapshot JSONB NOT NULL,
  dld_snapshot JSONB NOT NULL,
  resolution TEXT NOT NULL DEFAULT 'pending' CHECK (resolution IN ('pending','approved','rejected')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.dld_scrape_conflicts TO authenticated;
GRANT ALL ON public.dld_scrape_conflicts TO service_role;
ALTER TABLE public.dld_scrape_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manage conflicts" ON public.dld_scrape_conflicts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_dld_conflicts_pending ON public.dld_scrape_conflicts(segment, resolution) WHERE resolution = 'pending';

-- ─────────────────────────────────────────────────────────────
-- Extend crm_brokers with DLD-native fields for filter parity
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS dld_license_category TEXT,   -- 'sale' | 'lease' | 'mortgage' | 'nationals' | 'group_a'
  ADD COLUMN IF NOT EXISTS dld_broker_no TEXT,
  ADD COLUMN IF NOT EXISTS dld_area TEXT,
  ADD COLUMN IF NOT EXISTS dld_project TEXT,
  ADD COLUMN IF NOT EXISTS dld_source TEXT,               -- 'dld_daily' | 'manual' | 'upload'
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS dld_license_category TEXT,   -- 'sale' | 'lease' | 'mortgage' | 'offices' | 'nationals' | 'group_a'
  ADD COLUMN IF NOT EXISTS dld_office_no TEXT,
  ADD COLUMN IF NOT EXISTS dld_area TEXT,
  ADD COLUMN IF NOT EXISTS dld_source TEXT,
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS dld_source TEXT,
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_crm_brokers_dld_cat ON public.crm_brokers(dld_license_category);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_dld_cat ON public.crm_brokerages(dld_license_category);
