-- =========================================================
-- Outreach schema for Developers + Brokerages (shared fields)
-- =========================================================

-- 1. ENUMS -------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.outreach_stage AS ENUM (
    'not_contacted','attempted','engaged','meeting_booked',
    'nda_pending','nda_signed','active_partner','dormant',
    'declined','blacklisted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.outreach_channel AS ENUM (
    'email','phone','whatsapp','linkedin','in_person','unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nda_status AS ENUM (
    'none','requested','sent','signed','expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.outreach_source AS ENUM (
    'manual','import','referral','website','event','cold_research','inbound'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.outreach_entity_type AS ENUM ('developer','brokerage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.outreach_direction AS ENUM ('outbound','inbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. SHARED COLUMNS ON crm_developer_registry --------------
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS outreach_stage public.outreach_stage NOT NULL DEFAULT 'not_contacted',
  ADD COLUMN IF NOT EXISTS outreach_channel_pref public.outreach_channel NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_outreach_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempt_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_note text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dnc_reason text,
  ADD COLUMN IF NOT EXISTS nda_status public.nda_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS nda_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_e164 text,
  ADD COLUMN IF NOT EXISTS source public.outreach_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS health_score integer;

-- 3. SHARED COLUMNS ON crm_brokerages ----------------------
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS outreach_stage public.outreach_stage NOT NULL DEFAULT 'not_contacted',
  ADD COLUMN IF NOT EXISTS outreach_channel_pref public.outreach_channel NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_outreach_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempt_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_note text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dnc_reason text,
  ADD COLUMN IF NOT EXISTS nda_status public.nda_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS nda_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_e164 text,
  ADD COLUMN IF NOT EXISTS source public.outreach_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS health_score integer;

-- 4. INDEXES ----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_crm_dev_outreach_stage
  ON public.crm_developer_registry (owner_id, outreach_stage, next_action_at);
CREATE INDEX IF NOT EXISTS idx_crm_dev_assigned
  ON public.crm_developer_registry (assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_brk_outreach_stage
  ON public.crm_brokerages (owner_id, outreach_stage, next_action_at);
CREATE INDEX IF NOT EXISTS idx_crm_brk_assigned
  ON public.crm_brokerages (assigned_to) WHERE assigned_to IS NOT NULL;

-- 5. SHARED VALIDATION FUNCTION ---------------------------
CREATE OR REPLACE FUNCTION public.validate_outreach_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- URL format
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url !~* '^https?://[^\s]+$' THEN
    RAISE EXCEPTION 'linkedin_url must be a valid http(s) URL';
  END IF;

  -- E.164
  IF NEW.whatsapp_e164 IS NOT NULL AND NEW.whatsapp_e164 !~ '^\+[1-9][0-9]{6,14}$' THEN
    RAISE EXCEPTION 'whatsapp_e164 must be E.164 (e.g. +9715XXXXXXXX)';
  END IF;

  -- Counters non-negative (clamp)
  IF NEW.response_count < 0 THEN NEW.response_count := 0; END IF;
  IF NEW.attempt_count  < 0 THEN NEW.attempt_count  := 0; END IF;

  -- Health score range
  IF NEW.health_score IS NOT NULL AND (NEW.health_score < 0 OR NEW.health_score > 100) THEN
    RAISE EXCEPTION 'health_score must be between 0 and 100';
  END IF;

  -- DNC integrity
  IF NEW.do_not_contact = true THEN
    IF NEW.dnc_reason IS NULL OR length(btrim(NEW.dnc_reason)) = 0 THEN
      RAISE EXCEPTION 'dnc_reason is required when do_not_contact is true';
    END IF;
    IF NEW.outreach_stage NOT IN ('blacklisted','declined','dormant') THEN
      NEW.outreach_stage := 'blacklisted';
    END IF;
  END IF;

  -- NDA integrity
  IF NEW.nda_status = 'signed' AND NEW.nda_signed_at IS NULL THEN
    NEW.nda_signed_at := now();
  END IF;
  IF NEW.nda_status <> 'signed' THEN
    NEW.nda_signed_at := NULL;
  END IF;

  -- next_action_note length
  IF NEW.next_action_note IS NOT NULL AND length(NEW.next_action_note) > 500 THEN
    RAISE EXCEPTION 'next_action_note must be 500 chars or fewer';
  END IF;

  RETURN NEW;
END $$;

-- Developer-specific email validator
CREATE OR REPLACE FUNCTION public.validate_developer_outreach()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.developer_email IS NOT NULL
     AND NEW.developer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'developer_email is not a valid email address';
  END IF;
  RETURN NEW;
END $$;

-- Brokerage-specific URL validator
CREATE OR REPLACE FUNCTION public.validate_brokerage_outreach()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.website IS NOT NULL AND NEW.website !~* '^https?://[^\s]+$' THEN
    RAISE EXCEPTION 'website must be a valid http(s) URL';
  END IF;
  RETURN NEW;
END $$;

-- 6. ATTACH TRIGGERS --------------------------------------
DROP TRIGGER IF EXISTS trg_validate_outreach_dev ON public.crm_developer_registry;
CREATE TRIGGER trg_validate_outreach_dev
  BEFORE INSERT OR UPDATE ON public.crm_developer_registry
  FOR EACH ROW EXECUTE FUNCTION public.validate_outreach_fields();

DROP TRIGGER IF EXISTS trg_validate_developer_outreach ON public.crm_developer_registry;
CREATE TRIGGER trg_validate_developer_outreach
  BEFORE INSERT OR UPDATE ON public.crm_developer_registry
  FOR EACH ROW EXECUTE FUNCTION public.validate_developer_outreach();

DROP TRIGGER IF EXISTS trg_validate_outreach_brk ON public.crm_brokerages;
CREATE TRIGGER trg_validate_outreach_brk
  BEFORE INSERT OR UPDATE ON public.crm_brokerages
  FOR EACH ROW EXECUTE FUNCTION public.validate_outreach_fields();

DROP TRIGGER IF EXISTS trg_validate_brokerage_outreach ON public.crm_brokerages;
CREATE TRIGGER trg_validate_brokerage_outreach
  BEFORE INSERT OR UPDATE ON public.crm_brokerages
  FOR EACH ROW EXECUTE FUNCTION public.validate_brokerage_outreach();

-- 7. crm_outreach_touchpoints -----------------------------
CREATE TABLE IF NOT EXISTS public.crm_outreach_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type public.outreach_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  channel public.outreach_channel NOT NULL DEFAULT 'unknown',
  direction public.outreach_direction NOT NULL DEFAULT 'outbound',
  subject text,
  body_excerpt text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_tp_entity
  ON public.crm_outreach_touchpoints (entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_tp_owner_time
  ON public.crm_outreach_touchpoints (owner_id, occurred_at DESC);

ALTER TABLE public.crm_outreach_touchpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners select touchpoints"   ON public.crm_outreach_touchpoints;
DROP POLICY IF EXISTS "Owners insert touchpoints"   ON public.crm_outreach_touchpoints;
DROP POLICY IF EXISTS "Owners update touchpoints"   ON public.crm_outreach_touchpoints;
DROP POLICY IF EXISTS "Owners delete touchpoints"   ON public.crm_outreach_touchpoints;

CREATE POLICY "Owners select touchpoints"
  ON public.crm_outreach_touchpoints FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners insert touchpoints"
  ON public.crm_outreach_touchpoints FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners update touchpoints"
  ON public.crm_outreach_touchpoints FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete touchpoints"
  ON public.crm_outreach_touchpoints FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Touchpoint hygiene: validate + bump parent counters on insert
CREATE OR REPLACE FUNCTION public.validate_outreach_touchpoint()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.body_excerpt IS NOT NULL AND length(NEW.body_excerpt) > 2000 THEN
    NEW.body_excerpt := substr(NEW.body_excerpt, 1, 2000);
  END IF;
  IF NEW.subject IS NOT NULL AND length(NEW.subject) > 300 THEN
    NEW.subject := substr(NEW.subject, 1, 300);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.bump_parent_on_touchpoint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.entity_type = 'developer' THEN
    UPDATE public.crm_developer_registry
       SET last_interaction_at = NEW.occurred_at,
           last_outreach_at  = CASE WHEN NEW.direction = 'outbound' THEN NEW.occurred_at ELSE last_outreach_at END,
           last_response_at  = CASE WHEN NEW.direction = 'inbound'  THEN NEW.occurred_at ELSE last_response_at END,
           attempt_count     = CASE WHEN NEW.direction = 'outbound' THEN attempt_count + 1 ELSE attempt_count END,
           response_count    = CASE WHEN NEW.direction = 'inbound'  THEN response_count + 1 ELSE response_count END,
           updated_at = now()
     WHERE id = NEW.entity_id;
  ELSIF NEW.entity_type = 'brokerage' THEN
    UPDATE public.crm_brokerages
       SET last_interaction_at = NEW.occurred_at,
           last_outreach_at  = CASE WHEN NEW.direction = 'outbound' THEN NEW.occurred_at ELSE last_outreach_at END,
           last_response_at  = CASE WHEN NEW.direction = 'inbound'  THEN NEW.occurred_at ELSE last_response_at END,
           attempt_count     = CASE WHEN NEW.direction = 'outbound' THEN attempt_count + 1 ELSE attempt_count END,
           response_count    = CASE WHEN NEW.direction = 'inbound'  THEN response_count + 1 ELSE response_count END,
           updated_at = now()
     WHERE id = NEW.entity_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_touchpoint ON public.crm_outreach_touchpoints;
CREATE TRIGGER trg_validate_touchpoint
  BEFORE INSERT OR UPDATE ON public.crm_outreach_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.validate_outreach_touchpoint();

DROP TRIGGER IF EXISTS trg_bump_parent_on_touchpoint ON public.crm_outreach_touchpoints;
CREATE TRIGGER trg_bump_parent_on_touchpoint
  AFTER INSERT ON public.crm_outreach_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.bump_parent_on_touchpoint();

DROP TRIGGER IF EXISTS trg_outreach_tp_updated_at ON public.crm_outreach_touchpoints;
CREATE TRIGGER trg_outreach_tp_updated_at
  BEFORE UPDATE ON public.crm_outreach_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. crm_outreach_tags ------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_outreach_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  label text NOT NULL,
  color text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, label)
);

ALTER TABLE public.crm_outreach_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners select tags"   ON public.crm_outreach_tags;
DROP POLICY IF EXISTS "Owners insert tags"   ON public.crm_outreach_tags;
DROP POLICY IF EXISTS "Owners update tags"   ON public.crm_outreach_tags;
DROP POLICY IF EXISTS "Owners delete tags"   ON public.crm_outreach_tags;

CREATE POLICY "Owners select tags"
  ON public.crm_outreach_tags FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners insert tags"
  ON public.crm_outreach_tags FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners update tags"
  ON public.crm_outreach_tags FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete tags"
  ON public.crm_outreach_tags FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
