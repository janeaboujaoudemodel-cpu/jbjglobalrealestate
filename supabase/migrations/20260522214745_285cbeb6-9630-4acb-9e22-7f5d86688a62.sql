
-- ===================================================================
-- Owner-only Lead Access Inspector + Controller
-- ===================================================================
-- Adds two SECURITY DEFINER functions used by the new per-lead
-- "Access" dialog in the owner CRM. Both refuse to run for anyone
-- whose auth.email() is not the owner email. Every mutation is
-- single-row and fully audited.
-- ===================================================================

-- 1) READ: enumerate every broker who can see a given lead today
CREATE OR REPLACE FUNCTION public.crm_owner_list_access(p_lead_id uuid)
RETURNS TABLE (
  source            text,    -- 'direct_share' | 'database_grant'
  source_row_id     uuid,    -- crm_lead_shares.id  OR  crm_database_grants.id
  source_label      text,    -- 'Direct share' or '<database folder name>'
  broker_user_id    uuid,
  broker_id         uuid,    -- crm_brokers.id (nullable if not registered yet)
  broker_name       text,
  permission_level  text,
  started_at        timestamptz,
  expires_at        timestamptz,
  status            text     -- 'active' | 'suspended' | 'expired'
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Owner-only guard
  IF COALESCE(auth.email(), '') <> 'janeaboujaoudenails@gmail.com' THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  RETURN QUERY
  -- (a) Direct per-lead shares
  SELECT
    'direct_share'::text                                            AS source,
    s.id                                                            AS source_row_id,
    'Direct share'::text                                            AS source_label,
    s.shared_with                                                   AS broker_user_id,
    b.id                                                            AS broker_id,
    COALESCE(b.full_name, 'Broker')                                 AS broker_name,
    s.permission_level                                              AS permission_level,
    s.created_at                                                    AS started_at,
    s.expires_at                                                    AS expires_at,
    CASE
      WHEN s.revoked_at IS NOT NULL                  THEN 'suspended'
      WHEN s.expires_at IS NOT NULL
        AND s.expires_at <= now()                    THEN 'expired'
      ELSE 'active'
    END                                                             AS status
  FROM public.crm_lead_shares s
  LEFT JOIN public.crm_brokers b ON b.user_id = s.shared_with
  WHERE s.lead_id = p_lead_id

  UNION ALL

  -- (b) Database/folder grants that include this lead
  SELECT
    'database_grant'::text                                          AS source,
    g.id                                                            AS source_row_id,
    ('Database — ' || COALESCE(f.name, 'unnamed'))::text            AS source_label,
    g.broker_user_id                                                AS broker_user_id,
    b.id                                                            AS broker_id,
    COALESCE(b.full_name, 'Broker')                                 AS broker_name,
    g.permission_level                                              AS permission_level,
    g.granted_at                                                    AS started_at,
    g.expires_at                                                    AS expires_at,
    CASE
      WHEN g.revoked_at   IS NOT NULL                THEN 'suspended'
      WHEN g.suspended_at IS NOT NULL                THEN 'suspended'
      WHEN g.expires_at   IS NOT NULL
        AND g.expires_at <= now()                    THEN 'expired'
      ELSE 'active'
    END                                                             AS status
  FROM public.crm_database_grants g
  JOIN public.crm_database_folders f ON f.id = g.source_database_id
  LEFT JOIN public.crm_brokers b ON b.user_id = g.broker_user_id
  WHERE EXISTS (
    SELECT 1 FROM public.crm_leads l
    WHERE l.id = p_lead_id
      AND l.source_database_id = g.source_database_id
  )
  ORDER BY status, source, started_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_owner_list_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_owner_list_access(uuid) TO authenticated;


-- 2) WRITE: Suspend / Restore / Revoke a single access row, fully audited
CREATE OR REPLACE FUNCTION public.crm_owner_set_access_status(
  p_source         text,    -- 'direct_share' | 'database_grant'
  p_source_row_id  uuid,
  p_action         text,    -- 'suspend' | 'restore' | 'revoke'
  p_reason         text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id   uuid := auth.uid();
  v_lead_id    uuid;
  v_broker_id  uuid;
  v_before     jsonb;
  v_after      jsonb;
BEGIN
  -- Owner-only guard
  IF COALESCE(auth.email(), '') <> 'janeaboujaoudenails@gmail.com' THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  IF p_action NOT IN ('suspend','restore','revoke') THEN
    RAISE EXCEPTION 'invalid_action: %', p_action;
  END IF;
  IF p_source NOT IN ('direct_share','database_grant') THEN
    RAISE EXCEPTION 'invalid_source: %', p_source;
  END IF;

  -- ---- direct lead share ---------------------------------------------------
  IF p_source = 'direct_share' THEN
    SELECT to_jsonb(s.*), s.lead_id, s.shared_with
      INTO v_before, v_lead_id, v_broker_id
    FROM public.crm_lead_shares s
    WHERE s.id = p_source_row_id
    FOR UPDATE;

    IF v_before IS NULL THEN
      RAISE EXCEPTION 'share_not_found';
    END IF;

    IF p_action IN ('suspend','revoke') THEN
      -- idempotent
      IF (v_before->>'revoked_at') IS NULL THEN
        UPDATE public.crm_lead_shares
          SET revoked_at = now()
          WHERE id = p_source_row_id
          RETURNING to_jsonb(crm_lead_shares.*) INTO v_after;
      ELSE
        v_after := v_before;
      END IF;
    ELSE
      -- restore: clear revoked_at
      UPDATE public.crm_lead_shares
        SET revoked_at = NULL
        WHERE id = p_source_row_id
        RETURNING to_jsonb(crm_lead_shares.*) INTO v_after;
    END IF;

  -- ---- database grant ------------------------------------------------------
  ELSE
    SELECT to_jsonb(g.*), NULL::uuid, g.broker_user_id
      INTO v_before, v_lead_id, v_broker_id
    FROM public.crm_database_grants g
    WHERE g.id = p_source_row_id
    FOR UPDATE;

    IF v_before IS NULL THEN
      RAISE EXCEPTION 'grant_not_found';
    END IF;

    IF p_action = 'suspend' THEN
      IF (v_before->>'suspended_at') IS NULL THEN
        UPDATE public.crm_database_grants
          SET suspended_at   = now(),
              suspend_reason = COALESCE(p_reason, suspend_reason)
          WHERE id = p_source_row_id
          RETURNING to_jsonb(crm_database_grants.*) INTO v_after;
      ELSE
        v_after := v_before;
      END IF;
    ELSIF p_action = 'restore' THEN
      UPDATE public.crm_database_grants
        SET suspended_at   = NULL,
            revoked_at     = NULL,
            suspend_reason = NULL,
            revoke_reason  = NULL
        WHERE id = p_source_row_id
        RETURNING to_jsonb(crm_database_grants.*) INTO v_after;
    ELSE -- revoke (hard)
      IF (v_before->>'revoked_at') IS NULL THEN
        UPDATE public.crm_database_grants
          SET revoked_at    = now(),
              revoke_reason = COALESCE(p_reason, revoke_reason)
          WHERE id = p_source_row_id
          RETURNING to_jsonb(crm_database_grants.*) INTO v_after;
      ELSE
        v_after := v_before;
      END IF;
    END IF;
  END IF;

  -- ---- Audit trail (best-effort; never blocks the user) --------------------
  BEGIN
    INSERT INTO public.crm_audit_logs (user_id, action, entity_type, entity_id, changes)
    VALUES (
      v_owner_id,
      'access_' || p_action,
      p_source,
      p_source_row_id,
      jsonb_build_object(
        'lead_id', v_lead_id,
        'broker_user_id', v_broker_id,
        'reason', p_reason,
        'before', v_before,
        'after',  v_after
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    INSERT INTO public.crm_security_events (user_id, event_type, details, user_agent)
    VALUES (
      v_owner_id,
      'lead_access_' || p_action,
      jsonb_build_object(
        'source', p_source,
        'source_row_id', p_source_row_id,
        'lead_id', v_lead_id,
        'broker_user_id', v_broker_id,
        'reason', p_reason
      ),
      'owner-crm-access-dialog'
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object(
    'ok', true,
    'source', p_source,
    'source_row_id', p_source_row_id,
    'action', p_action,
    'before', v_before,
    'after', v_after
  );
END;
$$;

REVOKE ALL ON FUNCTION public.crm_owner_set_access_status(text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_owner_set_access_status(text, uuid, text, text) TO authenticated;
