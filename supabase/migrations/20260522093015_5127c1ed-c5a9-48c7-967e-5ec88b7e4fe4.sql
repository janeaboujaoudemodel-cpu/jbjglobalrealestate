
-- Phase 1: Private vs Shared workspace switching for owner CRM edits.

-- 1) Replace the trigger function to honour a per-transaction context GUC.
--    crm.context = 'private'  → DO NOT enqueue (owner edit stays private)
--    crm.context = 'shared'   → enqueue AND publish immediately (live to broker)
--    default (no GUC set)     → 'private' (safer default)
CREATE OR REPLACE FUNCTION public.crm_capture_owner_lead_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_email text;
  v_ctx         text;
  v_diff        jsonb := '{}'::jsonb;
  v_publish_at  timestamptz;
  v_publish_by  uuid;
BEGIN
  -- Only owner edits matter
  SELECT email INTO v_actor_email FROM auth.users WHERE id = auth.uid();
  IF v_actor_email IS DISTINCT FROM 'janeaboujaoudenails@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- Read the request-scoped context (defaults to 'private' for safety)
  v_ctx := COALESCE(NULLIF(current_setting('crm.context', true), ''), 'private');

  -- Private edits: do nothing. Privacy preserved.
  IF v_ctx = 'private' THEN
    RETURN NEW;
  END IF;

  -- Build a sparse diff of changed columns
  SELECT jsonb_object_agg(key, value)
    INTO v_diff
    FROM jsonb_each(to_jsonb(NEW))
   WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
     AND key NOT IN ('updated_at','created_at','id');

  IF v_diff IS NULL OR v_diff = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Shared edits go live immediately (auto-publish)
  IF v_ctx = 'shared' THEN
    v_publish_at := now();
    v_publish_by := auth.uid();
  ELSE
    v_publish_at := NULL;  -- manual mode → queued
    v_publish_by := NULL;
  END IF;

  INSERT INTO crm_lead_publish_queue
    (share_id, lead_id, broker_user_id, edited_by, field_diff, published_at, published_by)
  SELECT s.id, s.lead_id, s.shared_with, auth.uid(), v_diff, v_publish_at, v_publish_by
    FROM crm_lead_shares s
   WHERE s.lead_id = NEW.id
     AND s.revoked_at IS NULL;

  RETURN NEW;
END
$$;

-- 2) Helper RPC to publish all pending diffs for a given lead (used by the
--    Shared workspace as a safety net if any pre-existing queue entries
--    exist for that lead).
CREATE OR REPLACE FUNCTION public.crm_publish_lead_diffs_for_lead(p_lead_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM 'janeaboujaoudenails@gmail.com' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE crm_lead_publish_queue
     SET published_at = now(),
         published_by = auth.uid()
   WHERE lead_id = p_lead_id
     AND published_at IS NULL
     AND discarded_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END
$$;

-- 3) Tiny helper that lets the client set the context GUC from a single RPC
--    call (cleaner than running ad-hoc SELECT set_config).
CREATE OR REPLACE FUNCTION public.crm_set_context(p_ctx text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_ctx NOT IN ('private','shared') THEN
    RAISE EXCEPTION 'invalid context: %', p_ctx;
  END IF;
  PERFORM set_config('crm.context', p_ctx, true);
END
$$;

GRANT EXECUTE ON FUNCTION public.crm_set_context(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_publish_lead_diffs_for_lead(uuid) TO authenticated;

-- 4) Broker activity audit log (covers calls, whatsapps, emails, status
--    changes, lead create/edit, file opens, exports, logins). Owner-only.
CREATE TABLE IF NOT EXISTS public.crm_broker_activity_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id    uuid NOT NULL,
  broker_user_id uuid,
  lead_id      uuid,
  action       text NOT NULL,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address   text,
  user_agent   text,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_activity_broker ON public.crm_broker_activity_log (broker_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_broker_activity_lead   ON public.crm_broker_activity_log (lead_id, occurred_at DESC);

ALTER TABLE public.crm_broker_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_reads_broker_activity" ON public.crm_broker_activity_log;
CREATE POLICY "owner_reads_broker_activity"
  ON public.crm_broker_activity_log
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'janeaboujaoudenails@gmail.com');

DROP POLICY IF EXISTS "owner_writes_broker_activity" ON public.crm_broker_activity_log;
CREATE POLICY "owner_writes_broker_activity"
  ON public.crm_broker_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.email() = 'janeaboujaoudenails@gmail.com');

DROP POLICY IF EXISTS "broker_writes_own_activity" ON public.crm_broker_activity_log;
CREATE POLICY "broker_writes_own_activity"
  ON public.crm_broker_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (broker_user_id = auth.uid());

-- 5) Per-broker aggregate view (owner-only)
DROP VIEW IF EXISTS public.vw_crm_broker_profile;
CREATE VIEW public.vw_crm_broker_profile
WITH (security_invoker = on) AS
SELECT
  b.id                        AS broker_id,
  b.owner_id                  AS broker_user_id,
  b.full_name,
  COALESCE(b.personal_email, b.company_email, b.email_lower) AS email,
  b.last_active_at,
  (SELECT count(*) FROM crm_lead_shares s
     WHERE s.shared_with = b.owner_id
       AND s.revoked_at IS NULL)                            AS leads_shared,
  (SELECT count(*) FROM crm_broker_activity_log a
     WHERE a.broker_id = b.id)                              AS activity_count,
  (SELECT max(occurred_at) FROM crm_broker_activity_log a
     WHERE a.broker_id = b.id)                              AS last_activity_at
FROM crm_brokers b;
