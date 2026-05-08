
-- ============================================================
-- PHASE 1: Unified CRM relational schema (additive, non-breaking)
-- ============================================================

-- -----------------------------------------------------------
-- 1) Broker <-> Brokerage relational link
-- -----------------------------------------------------------
ALTER TABLE public.crm_brokerage_agents
  ADD COLUMN IF NOT EXISTS broker_id uuid REFERENCES public.crm_brokers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_broker_id
  ON public.crm_brokerage_agents(broker_id);

ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS current_brokerage_id uuid REFERENCES public.crm_brokerages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_title text,
  ADD COLUMN IF NOT EXISTS database_source text,
  ADD COLUMN IF NOT EXISTS event_source text,
  ADD COLUMN IF NOT EXISTS upload_source text,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS imported_by uuid,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_crm_brokers_current_brokerage_id
  ON public.crm_brokers(current_brokerage_id);

-- Sync trigger: when an agent row is created or its brokerage changes,
-- update the broker's current_brokerage_id and append to broker_company_history.
CREATE OR REPLACE FUNCTION public.sync_broker_company_on_agent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company text;
BEGIN
  IF NEW.broker_id IS NULL OR NEW.brokerage_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only act when brokerage actually changed (or row is brand new)
  IF TG_OP = 'UPDATE' AND OLD.brokerage_id IS NOT DISTINCT FROM NEW.brokerage_id THEN
    RETURN NEW;
  END IF;

  SELECT company_name INTO v_company
  FROM public.crm_brokerages WHERE id = NEW.brokerage_id;

  -- Close any currently-open history row for this broker
  UPDATE public.broker_company_history
     SET ended_at = now()
   WHERE broker_id = NEW.broker_id AND ended_at IS NULL;

  -- Insert new open history row
  INSERT INTO public.broker_company_history (broker_id, company_name, started_at)
  VALUES (NEW.broker_id, COALESCE(v_company, ''), now());

  -- Update the broker's current pointer + denormalized name
  UPDATE public.crm_brokers
     SET current_brokerage_id = NEW.brokerage_id,
         current_company = COALESCE(v_company, current_company),
         updated_at = now()
   WHERE id = NEW.broker_id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_broker_company ON public.crm_brokerage_agents;
CREATE TRIGGER trg_sync_broker_company
AFTER INSERT OR UPDATE OF brokerage_id, broker_id ON public.crm_brokerage_agents
FOR EACH ROW EXECUTE FUNCTION public.sync_broker_company_on_agent_change();

-- -----------------------------------------------------------
-- 2) Brokerage source-tracking columns
-- -----------------------------------------------------------
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS database_source text,
  ADD COLUMN IF NOT EXISTS event_source text,
  ADD COLUMN IF NOT EXISTS upload_source text,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS imported_by uuid,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------
-- 3) Developer registry source-tracking + assigned team
-- -----------------------------------------------------------
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS database_source text,
  ADD COLUMN IF NOT EXISTS event_source text,
  ADD COLUMN IF NOT EXISTS upload_source text,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS imported_by uuid,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------
-- 4) Developer Representatives -> developer link + history + enrichment
-- -----------------------------------------------------------
ALTER TABLE public.developer_representatives
  ADD COLUMN IF NOT EXISTS current_developer_id uuid REFERENCES public.crm_developer_registry(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS email_normalized text,
  ADD COLUMN IF NOT EXISTS phone_normalized text,
  ADD COLUMN IF NOT EXISTS whatsapp_normalized text,
  ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS database_source text,
  ADD COLUMN IF NOT EXISTS event_source text,
  ADD COLUMN IF NOT EXISTS upload_source text,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS imported_by uuid,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS import_label text,
  ADD COLUMN IF NOT EXISTS source_batch_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS source_history jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_developer_representatives_current_developer
  ON public.developer_representatives(current_developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_representatives_email_norm
  ON public.developer_representatives(email_normalized);
CREATE INDEX IF NOT EXISTS idx_developer_representatives_phone_norm
  ON public.developer_representatives(phone_normalized);

-- Mirror of broker_company_history for developer reps
CREATE TABLE IF NOT EXISTS public.developer_rep_company_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid NOT NULL REFERENCES public.developer_representatives(id) ON DELETE CASCADE,
  developer_id uuid REFERENCES public.crm_developer_registry(id) ON DELETE SET NULL,
  developer_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dev_rep_history_rep ON public.developer_rep_company_history(representative_id);
CREATE INDEX IF NOT EXISTS idx_dev_rep_history_dev ON public.developer_rep_company_history(developer_id);

ALTER TABLE public.developer_rep_company_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage dev rep history" ON public.developer_rep_company_history;
CREATE POLICY "Admins manage dev rep history"
  ON public.developer_rep_company_history
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sync trigger for developer reps
CREATE OR REPLACE FUNCTION public.sync_dev_rep_company_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.current_developer_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.current_developer_id IS NOT DISTINCT FROM NEW.current_developer_id THEN
    RETURN NEW;
  END IF;

  SELECT developer_name INTO v_name
  FROM public.crm_developer_registry WHERE id = NEW.current_developer_id;

  UPDATE public.developer_rep_company_history
     SET ended_at = now()
   WHERE representative_id = NEW.id AND ended_at IS NULL;

  INSERT INTO public.developer_rep_company_history
    (representative_id, developer_id, developer_name, started_at)
  VALUES (NEW.id, NEW.current_developer_id, COALESCE(v_name, NEW.developer_name, ''), now());

  -- Keep the legacy text field in sync so existing UIs keep working
  IF v_name IS NOT NULL THEN
    NEW.developer_name := v_name;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_dev_rep_company ON public.developer_representatives;
CREATE TRIGGER trg_sync_dev_rep_company
BEFORE INSERT OR UPDATE OF current_developer_id ON public.developer_representatives
FOR EACH ROW EXECUTE FUNCTION public.sync_dev_rep_company_change();

-- -----------------------------------------------------------
-- 5) crm_leads source-tracking parity
-- -----------------------------------------------------------
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS database_source text,
  ADD COLUMN IF NOT EXISTS event_source text,
  ADD COLUMN IF NOT EXISTS upload_source text,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS source_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------
-- 6) Unified contacts view (read-only, security invoker)
--    Powers global search + the unified export endpoint.
-- -----------------------------------------------------------
DROP VIEW IF EXISTS public.vw_crm_contacts;
CREATE VIEW public.vw_crm_contacts
WITH (security_invoker = true) AS
SELECT
  b.id,
  'broker'::text                    AS kind,
  b.full_name                       AS name,
  b.email_lower                     AS email,
  b.phone_e164                      AS phone,
  b.current_brokerage_id            AS company_id,
  'brokerage'::text                 AS company_kind,
  b.current_company                 AS company_name,
  b.database_source                 AS source,
  b.labels                          AS labels,
  b.last_active_at                  AS last_interaction_at,
  b.owner_id                        AS owner_id,
  b.created_at                      AS created_at
FROM public.crm_brokers b
UNION ALL
SELECT
  a.id,
  'brokerage_agent'::text,
  a.name,
  a.email,
  a.phone,
  a.brokerage_id,
  'brokerage'::text,
  br.company_name,
  a.source,
  a.specialty_labels,
  a.updated_at,
  a.owner_id,
  a.created_at
FROM public.crm_brokerage_agents a
LEFT JOIN public.crm_brokerages br ON br.id = a.brokerage_id
UNION ALL
SELECT
  r.id,
  'developer_rep'::text,
  COALESCE(r.full_name, r.role),
  COALESCE(r.email, r.personal_email, r.company_email),
  COALESCE(r.phone, r.personal_phone, r.company_phone),
  r.current_developer_id,
  'developer'::text,
  r.developer_name,
  r.source,
  r.labels,
  r.last_active_at,
  r.user_id,
  r.created_at
FROM public.developer_representatives r
UNION ALL
SELECT
  l.id,
  'investor_lead'::text,
  l.full_name,
  l.email_lower,
  l.phone_e164,
  NULL::uuid,
  'company'::text,
  l.company_name,
  COALESCE(l.database_source, l.source),
  l.tags,
  l.last_contacted_at,
  l.owner_user_id,
  l.created_at
FROM public.crm_leads l
WHERE l.lead_type = 'investor' OR l.lead_intent ILIKE 'invest%';

COMMENT ON VIEW public.vw_crm_contacts IS
  'Unified relational contacts view. Security invoker — RLS of underlying tables applies.';

-- -----------------------------------------------------------
-- 7) Single source-of-truth upsert helper
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_contact_with_company(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := lower(coalesce(payload->>'kind','broker'));   -- broker | developer_rep | investor
  v_owner uuid := coalesce(nullif(payload->>'owner_id','')::uuid, auth.uid());
  v_company_name text := nullif(payload->>'company_name','');
  v_company_id uuid;
  v_contact_id uuid;
  v_email text := lower(nullif(payload->>'email',''));
  v_phone text := nullif(payload->>'phone','');
  v_full_name text := nullif(payload->>'full_name','');
  v_role text := nullif(payload->>'role','');
  v_source jsonb := jsonb_build_object(
    'database_source', payload->>'database_source',
    'event_source',    payload->>'event_source',
    'upload_source',   payload->>'upload_source',
    'original_filename', payload->>'original_filename',
    'imported_by', coalesce(payload->>'imported_by', v_owner::text),
    'imported_at', coalesce(payload->>'imported_at', now()::text)
  );
BEGIN
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'upsert_contact_with_company: missing owner_id / auth.uid()';
  END IF;

  IF v_kind = 'broker' THEN
    -- Find or create brokerage
    IF v_company_name IS NOT NULL THEN
      SELECT id INTO v_company_id FROM public.crm_brokerages
       WHERE owner_id = v_owner AND lower(company_name) = lower(v_company_name)
       LIMIT 1;
      IF v_company_id IS NULL THEN
        INSERT INTO public.crm_brokerages
          (owner_id, company_name, database_source, event_source, upload_source,
           original_filename, imported_by, imported_at, source_history)
        VALUES (v_owner, v_company_name,
          v_source->>'database_source', v_source->>'event_source', v_source->>'upload_source',
          v_source->>'original_filename', v_owner, now(),
          jsonb_build_array(v_source))
        RETURNING id INTO v_company_id;
      END IF;
    END IF;

    -- Find or create individual broker
    SELECT id INTO v_contact_id FROM public.crm_brokers
     WHERE owner_id = v_owner
       AND ( (v_email IS NOT NULL AND email_lower = v_email)
          OR (v_phone IS NOT NULL AND phone_e164 = v_phone)
          OR (v_email IS NULL AND v_phone IS NULL AND lower(full_name) = lower(coalesce(v_full_name,''))) )
     LIMIT 1;

    IF v_contact_id IS NULL THEN
      INSERT INTO public.crm_brokers
        (owner_id, full_name, email_lower, phone_e164, current_company,
         current_brokerage_id, position_title,
         database_source, event_source, upload_source,
         original_filename, imported_by, imported_at, source_history)
      VALUES (v_owner, v_full_name, v_email, v_phone, v_company_name,
        v_company_id, v_role,
        v_source->>'database_source', v_source->>'event_source', v_source->>'upload_source',
        v_source->>'original_filename', v_owner, now(),
        jsonb_build_array(v_source))
      RETURNING id INTO v_contact_id;
    ELSE
      UPDATE public.crm_brokers
         SET full_name = COALESCE(v_full_name, full_name),
             email_lower = COALESCE(v_email, email_lower),
             phone_e164 = COALESCE(v_phone, phone_e164),
             current_company = COALESCE(v_company_name, current_company),
             current_brokerage_id = COALESCE(v_company_id, current_brokerage_id),
             position_title = COALESCE(v_role, position_title),
             source_history = source_history || jsonb_build_array(v_source),
             updated_at = now()
       WHERE id = v_contact_id;
    END IF;

    -- Create / refresh agent link row (this drives the brokerage-side view)
    IF v_company_id IS NOT NULL THEN
      INSERT INTO public.crm_brokerage_agents
        (brokerage_id, owner_id, broker_id, name, email, phone, role, source, source_history)
      VALUES (v_company_id, v_owner, v_contact_id, v_full_name, v_email, v_phone, v_role,
              v_source->>'database_source', jsonb_build_array(v_source))
      ON CONFLICT DO NOTHING;
    END IF;

    RETURN jsonb_build_object('kind','broker','contact_id',v_contact_id,'company_id',v_company_id);

  ELSIF v_kind = 'developer_rep' THEN
    -- Find or create developer
    IF v_company_name IS NOT NULL THEN
      SELECT id INTO v_company_id FROM public.crm_developer_registry
       WHERE owner_id = v_owner AND lower(developer_name) = lower(v_company_name)
       LIMIT 1;
      IF v_company_id IS NULL THEN
        INSERT INTO public.crm_developer_registry
          (owner_id, developer_name, developer_slug,
           database_source, event_source, upload_source, original_filename,
           imported_by, imported_at, source_history)
        VALUES (v_owner, v_company_name, lower(regexp_replace(v_company_name,'[^a-zA-Z0-9]+','-','g')),
          v_source->>'database_source', v_source->>'event_source',
          v_source->>'upload_source', v_source->>'original_filename',
          v_owner, now(), jsonb_build_array(v_source))
        RETURNING id INTO v_company_id;
      END IF;
    END IF;

    -- Find or create representative
    SELECT id INTO v_contact_id FROM public.developer_representatives
     WHERE user_id = v_owner
       AND ( (v_email IS NOT NULL AND (email = v_email OR email_normalized = v_email))
          OR (v_phone IS NOT NULL AND (phone = v_phone OR phone_normalized = v_phone))
          OR (v_email IS NULL AND v_phone IS NULL AND lower(full_name) = lower(coalesce(v_full_name,''))) )
     LIMIT 1;

    IF v_contact_id IS NULL THEN
      INSERT INTO public.developer_representatives
        (user_id, developer_name, current_developer_id,
         full_name, role, position, email, phone,
         email_normalized, phone_normalized,
         source, database_source, event_source, upload_source,
         original_filename, imported_by, imported_at, source_history)
      VALUES (v_owner, COALESCE(v_company_name,''), v_company_id,
        v_full_name, COALESCE(v_role,''), v_role, v_email, v_phone,
        v_email, v_phone,
        v_source->>'database_source', v_source->>'database_source',
        v_source->>'event_source', v_source->>'upload_source',
        v_source->>'original_filename', v_owner, now(),
        jsonb_build_array(v_source))
      RETURNING id INTO v_contact_id;
    ELSE
      UPDATE public.developer_representatives
         SET full_name = COALESCE(v_full_name, full_name),
             email = COALESCE(v_email, email),
             phone = COALESCE(v_phone, phone),
             email_normalized = COALESCE(v_email, email_normalized),
             phone_normalized = COALESCE(v_phone, phone_normalized),
             role = COALESCE(v_role, role),
             current_developer_id = COALESCE(v_company_id, current_developer_id),
             source_history = source_history || jsonb_build_array(v_source),
             updated_at = now()
       WHERE id = v_contact_id;
    END IF;

    RETURN jsonb_build_object('kind','developer_rep','contact_id',v_contact_id,'company_id',v_company_id);

  ELSIF v_kind = 'investor' THEN
    SELECT id INTO v_contact_id FROM public.crm_leads
     WHERE owner_user_id = v_owner
       AND ( (v_email IS NOT NULL AND email_lower = v_email)
          OR (v_phone IS NOT NULL AND phone_e164 = v_phone) )
     LIMIT 1;

    IF v_contact_id IS NULL THEN
      INSERT INTO public.crm_leads
        (owner_type, owner_user_id, created_by_user_id,
         full_name, email_lower, phone_e164, company_name,
         lead_type, source,
         database_source, event_source, upload_source,
         original_filename, imported_at, source_history)
      VALUES ('user', v_owner, v_owner,
        v_full_name, v_email, v_phone, v_company_name,
        'investor', v_source->>'database_source',
        v_source->>'database_source', v_source->>'event_source',
        v_source->>'upload_source', v_source->>'original_filename',
        now(), jsonb_build_array(v_source))
      RETURNING id INTO v_contact_id;
    ELSE
      UPDATE public.crm_leads
         SET full_name = COALESCE(v_full_name, full_name),
             company_name = COALESCE(v_company_name, company_name),
             source_history = source_history || jsonb_build_array(v_source),
             updated_at = now()
       WHERE id = v_contact_id;
    END IF;

    RETURN jsonb_build_object('kind','investor','contact_id',v_contact_id);

  ELSE
    RAISE EXCEPTION 'Unsupported kind: %', v_kind;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.upsert_contact_with_company(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_contact_with_company(jsonb) TO authenticated;
