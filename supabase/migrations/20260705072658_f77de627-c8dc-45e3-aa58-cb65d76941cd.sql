
-- Phase 1: tri-directional lead sync (JBJ CRM ↔ CRM ↔ Zoho) — schema
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cross-reference IDs so any of the three systems can locate the same lead.
ALTER TABLE public.jbj_leads
  ADD COLUMN IF NOT EXISTS zoho_lead_id text,
  ADD COLUMN IF NOT EXISTS crm_lead_id uuid,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_source text,
  ADD COLUMN IF NOT EXISTS zoho_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_error text;

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS zoho_lead_id text,
  ADD COLUMN IF NOT EXISTS jbj_lead_id uuid,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_source text,
  ADD COLUMN IF NOT EXISTS zoho_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_error text;

CREATE UNIQUE INDEX IF NOT EXISTS jbj_leads_zoho_id_uidx
  ON public.jbj_leads (zoho_lead_id) WHERE zoho_lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS jbj_leads_crm_id_uidx
  ON public.jbj_leads (crm_lead_id) WHERE crm_lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_zoho_id_uidx
  ON public.crm_leads (zoho_lead_id) WHERE zoho_lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_jbj_id_uidx
  ON public.crm_leads (jbj_lead_id) WHERE jbj_lead_id IS NOT NULL;

-- Advisory guard: triggers set this GUC while applying a sync so mirror
-- writes on the sibling table do not re-fire the outbound trigger.
CREATE OR REPLACE FUNCTION public.is_lead_sync_in_progress()
RETURNS boolean
LANGUAGE sql STABLE
AS $$ SELECT COALESCE(current_setting('jbj.lead_sync_in_progress', true), '') = 'on' $$;
