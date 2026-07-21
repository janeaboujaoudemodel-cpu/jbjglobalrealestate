
-- ============================================================================
-- Unified Relationships foundation:
--   1. Segment brokers into secondary / offplan (DLD license-category driven)
--   2. Add status + first_seen_at + last_contacted_at across all 3 segments
--   3. Central activity feed replacing the empty AgencyActivityLog
--   4. DLD daily sync run tracking (per-segment counters)
-- ============================================================================

-- ---- ENUMS ----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.broker_segment_kind AS ENUM ('secondary','offplan','both','unclassified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.relationship_status_kind AS ENUM (
    'untouched','needs_follow_up','briefing_booked','registered','declined','archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.relationship_segment_kind AS ENUM (
    'broker_secondary','broker_offplan','brokerage','developer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- crm_brokers: add segment + status ------------------------------------
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS broker_segment public.broker_segment_kind
    NOT NULL DEFAULT 'unclassified',
  ADD COLUMN IF NOT EXISTS relationship_status public.relationship_status_kind
    NOT NULL DEFAULT 'untouched',
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS dld_license_category text;

CREATE INDEX IF NOT EXISTS idx_crm_brokers_segment ON public.crm_brokers(broker_segment);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_status ON public.crm_brokers(relationship_status);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_first_seen ON public.crm_brokers(first_seen_at DESC);

-- ---- crm_brokerages: add status -------------------------------------------
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS relationship_status public.relationship_status_kind
    NOT NULL DEFAULT 'untouched',
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_status ON public.crm_brokerages(relationship_status);

-- ---- crm_developer_registry: add status -----------------------------------
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS relationship_status public.relationship_status_kind
    NOT NULL DEFAULT 'untouched',
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_crm_developers_status ON public.crm_developer_registry(relationship_status);

-- ---- Unified activity feed ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_relationship_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment public.relationship_segment_kind NOT NULL,
  target_id uuid NOT NULL, -- points to crm_brokers.id / crm_brokerages.id / crm_developer_registry.id
  target_label text NOT NULL, -- denormalized display name
  activity_type text NOT NULL, -- 'email_sent'|'email_reply'|'note'|'status_change'|'calendar_booked'|'reminder'|'dld_new'
  title text NOT NULL,
  detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id),
  status public.relationship_status_kind,
  done boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_segment_time ON public.crm_relationship_activity(segment, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_target ON public.crm_relationship_activity(target_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON public.crm_relationship_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_open ON public.crm_relationship_activity(done, deleted_at, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_relationship_activity TO authenticated;
GRANT ALL ON public.crm_relationship_activity TO service_role;

ALTER TABLE public.crm_relationship_activity ENABLE ROW LEVEL SECURITY;

-- Owner-only visibility (uses existing has_role helper)
CREATE POLICY "Owners manage relationship activity"
  ON public.crm_relationship_activity FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'owner'::app_role) OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'owner'::app_role) OR public.has_role(auth.uid(),'admin'::app_role));

-- updated_at trigger (function already exists in project)
DROP TRIGGER IF EXISTS trg_activity_updated_at ON public.crm_relationship_activity;
CREATE TRIGGER trg_activity_updated_at
  BEFORE UPDATE ON public.crm_relationship_activity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- DLD daily sync run tracking ------------------------------------------
-- Extends existing dld_daily_sync_runs concept with per-segment counters.
-- Table already exists (11 cols) — add columns idempotently.
ALTER TABLE public.dld_daily_sync_runs
  ADD COLUMN IF NOT EXISTS brokers_secondary_new integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brokers_offplan_new integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brokerages_new integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS developers_new integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_urls jsonb NOT NULL DEFAULT '{}'::jsonb;
