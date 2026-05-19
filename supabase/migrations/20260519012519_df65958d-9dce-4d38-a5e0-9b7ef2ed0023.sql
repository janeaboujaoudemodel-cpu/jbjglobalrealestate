
-- 1. is_active_broker flag + trigger
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS is_active_broker boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.crm_brokers_sync_active_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_active_broker := (NEW.activated_at IS NOT NULL AND NEW.blocked_at IS NULL AND NEW.user_id IS NOT NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_brokers_sync_active ON public.crm_brokers;
CREATE TRIGGER trg_crm_brokers_sync_active
  BEFORE INSERT OR UPDATE OF activated_at, blocked_at, user_id ON public.crm_brokers
  FOR EACH ROW EXECUTE FUNCTION public.crm_brokers_sync_active_flag();

UPDATE public.crm_brokers
  SET is_active_broker = (activated_at IS NOT NULL AND blocked_at IS NULL AND user_id IS NOT NULL)
  WHERE is_active_broker IS DISTINCT FROM (activated_at IS NOT NULL AND blocked_at IS NULL AND user_id IS NOT NULL);

-- 2. one broker entity per auth user
CREATE UNIQUE INDEX IF NOT EXISTS crm_brokers_user_id_unique
  ON public.crm_brokers(user_id)
  WHERE user_id IS NOT NULL;

-- 3. helper: does this user have an active grant on this database?
CREATE OR REPLACE FUNCTION public.broker_has_database_access(_user uuid, _db uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_database_grants g
    WHERE g.broker_user_id = _user
      AND g.source_database_id = _db
      AND g.revoked_at IS NULL
      AND g.suspended_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at > now())
  );
$$;

-- 4. owner-facing view: database x broker access summary
CREATE OR REPLACE VIEW public.vw_crm_database_access
WITH (security_invoker = on) AS
SELECT
  d.id                                AS database_id,
  d.name                              AS database_name,
  d.owner_user_id                     AS database_owner_user_id,
  g.id                                AS grant_id,
  b.id                                AS broker_id,
  g.broker_user_id                    AS broker_user_id,
  COALESCE(b.full_name, b.email_lower) AS broker_name,
  b.email_lower                       AS broker_email,
  g.permission_level,
  g.visibility_direction,
  g.date_window_mode,
  g.date_window_start,
  g.date_window_end,
  g.lead_ids,
  g.status_filter,
  g.granted_at,
  g.granted_by,
  g.expires_at,
  g.suspended_at,
  g.revoked_at,
  CASE
    WHEN g.revoked_at IS NOT NULL THEN 'revoked'
    WHEN g.suspended_at IS NOT NULL THEN 'suspended'
    WHEN g.expires_at IS NOT NULL AND g.expires_at <= now() THEN 'expired'
    ELSE 'active'
  END                                 AS status,
  b.invitation_status,
  b.activated_at,
  b.blocked_at,
  b.last_active_at
FROM public.crm_database_grants g
JOIN public.crm_source_databases d ON d.id = g.source_database_id
LEFT JOIN public.crm_brokers b ON b.user_id = g.broker_user_id;

-- 5. owner-facing view: per-broker overview
CREATE OR REPLACE VIEW public.vw_crm_broker_overview
WITH (security_invoker = on) AS
SELECT
  b.id                                AS broker_id,
  b.user_id,
  b.owner_id,
  COALESCE(b.full_name, b.email_lower) AS broker_name,
  b.email_lower                       AS broker_email,
  b.invitation_status,
  b.activated_at,
  b.blocked_at,
  b.is_active_broker,
  b.last_active_at,
  (SELECT COUNT(*)::int FROM public.crm_database_grants g
     WHERE g.broker_user_id = b.user_id AND g.revoked_at IS NULL) AS active_database_count,
  (SELECT COUNT(*)::int FROM public.crm_leads l
     WHERE l.assigned_broker_id = b.id) AS assigned_lead_count,
  (SELECT COUNT(*)::int FROM public.crm_broker_sessions s
     WHERE s.broker_id = b.id AND s.revoked_at IS NULL) AS active_session_count
FROM public.crm_brokers b;

-- 6. self-healing RPC: link an authenticated broker to their crm_brokers row by email
CREATE OR REPLACE FUNCTION public.link_broker_entity_by_email()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email   text;
  v_broker  uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN RETURN NULL; END IF;

  -- Already linked?
  SELECT id INTO v_broker FROM public.crm_brokers WHERE user_id = v_user_id LIMIT 1;
  IF v_broker IS NOT NULL THEN
    RETURN v_broker;
  END IF;

  -- Link by email if a matching row exists
  UPDATE public.crm_brokers
     SET user_id = v_user_id,
         activated_at = COALESCE(activated_at, now()),
         invitation_status = CASE WHEN invitation_status = 'not_invited' THEN 'activated' ELSE invitation_status END
   WHERE email_lower = v_email
     AND user_id IS NULL
   RETURNING id INTO v_broker;

  RETURN v_broker;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_broker_entity_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.broker_has_database_access(uuid, uuid) TO authenticated;
GRANT SELECT ON public.vw_crm_database_access TO authenticated;
GRANT SELECT ON public.vw_crm_broker_overview TO authenticated;
