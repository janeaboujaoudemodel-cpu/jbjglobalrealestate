
-- Enable extensions needed for realtime sync triggers and scheduled Zoho pulls
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cross-reference columns on jbj_leads
ALTER TABLE public.jbj_leads
  ADD COLUMN IF NOT EXISTS zoho_lead_id text,
  ADD COLUMN IF NOT EXISTS crm_lead_id uuid,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_source text,
  ADD COLUMN IF NOT EXISTS zoho_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_error text;

CREATE UNIQUE INDEX IF NOT EXISTS jbj_leads_zoho_lead_id_key
  ON public.jbj_leads (zoho_lead_id)
  WHERE zoho_lead_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS jbj_leads_crm_lead_id_key
  ON public.jbj_leads (crm_lead_id)
  WHERE crm_lead_id IS NOT NULL;

-- Cross-reference columns on crm_leads
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS zoho_lead_id text,
  ADD COLUMN IF NOT EXISTS jbj_lead_id uuid,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_source text,
  ADD COLUMN IF NOT EXISTS zoho_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_error text;

CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_zoho_lead_id_key
  ON public.crm_leads (zoho_lead_id)
  WHERE zoho_lead_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_jbj_lead_id_key
  ON public.crm_leads (jbj_lead_id)
  WHERE jbj_lead_id IS NOT NULL;

-- Sync guard: session-scoped flag so triggers can skip writes originating from the sync worker itself
CREATE OR REPLACE FUNCTION public.is_lead_sync_in_progress()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(current_setting('app.lead_sync_in_progress', true), '') = 'on'
$$;
