
-- Agency / broker status enums
DO $$ BEGIN
  CREATE TYPE public.agency_status_enum AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deal_portfolio_enum AS ENUM ('citi_developers','jbj_global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deal_status_enum AS ENUM ('draft','signed','invoiced','commission_received','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add status columns to brokerages
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS agency_status public.agency_status_enum;

-- Add status + registration to individual brokers
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS broker_status public.agency_status_enum,
  ADD COLUMN IF NOT EXISTS registration_with text;

-- Deals ledger
CREATE TABLE IF NOT EXISTS public.crm_my_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  portfolio public.deal_portfolio_enum NOT NULL,
  client_name text NOT NULL,
  client_contact text,
  project_name text,
  project_id uuid,
  developer_name text,
  developer_id uuid,
  brokerage_name text,
  brokerage_id uuid,
  broker_name text,
  broker_id uuid,
  deal_value_aed numeric(14,2) NOT NULL DEFAULT 0,
  commission_pct numeric(6,3) NOT NULL DEFAULT 0,
  commission_amount_aed numeric(14,2) GENERATED ALWAYS AS (deal_value_aed * commission_pct / 100) STORED,
  status public.deal_status_enum NOT NULL DEFAULT 'draft',
  close_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_my_deals TO authenticated;
GRANT ALL ON public.crm_my_deals TO service_role;

ALTER TABLE public.crm_my_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their deals"
  ON public.crm_my_deals FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS crm_my_deals_owner_portfolio_idx
  ON public.crm_my_deals (owner_id, portfolio, close_date DESC);

CREATE OR REPLACE FUNCTION public.tg_crm_my_deals_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS crm_my_deals_updated_at ON public.crm_my_deals;
CREATE TRIGGER crm_my_deals_updated_at
  BEFORE UPDATE ON public.crm_my_deals
  FOR EACH ROW EXECUTE FUNCTION public.tg_crm_my_deals_updated_at();
