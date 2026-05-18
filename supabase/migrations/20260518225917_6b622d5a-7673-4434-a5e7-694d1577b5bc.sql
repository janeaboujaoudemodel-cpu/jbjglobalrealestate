
ALTER TABLE public.crm_database_grants
  ADD COLUMN IF NOT EXISTS visibility_direction text NOT NULL DEFAULT 'broker_to_owner_only',
  ADD COLUMN IF NOT EXISTS date_window_mode    text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS date_window_start   timestamptz,
  ADD COLUMN IF NOT EXISTS date_window_end     timestamptz,
  ADD COLUMN IF NOT EXISTS lead_ids            uuid[],
  ADD COLUMN IF NOT EXISTS status_filter       text[],
  ADD COLUMN IF NOT EXISTS suspended_at        timestamptz,
  ADD COLUMN IF NOT EXISTS suspend_reason      text,
  ADD COLUMN IF NOT EXISTS restricted_at       timestamptz,
  ADD COLUMN IF NOT EXISTS revoke_reason       text;

ALTER TABLE public.crm_database_grants
  DROP CONSTRAINT IF EXISTS crm_database_grants_visibility_direction_check;
ALTER TABLE public.crm_database_grants
  ADD CONSTRAINT crm_database_grants_visibility_direction_check
  CHECK (visibility_direction IN ('broker_to_owner_only','bidirectional'));

ALTER TABLE public.crm_database_grants
  DROP CONSTRAINT IF EXISTS crm_database_grants_date_window_mode_check;
ALTER TABLE public.crm_database_grants
  ADD CONSTRAINT crm_database_grants_date_window_mode_check
  CHECK (date_window_mode IN ('all','today','last_7','last_30','custom','from_date'));

CREATE INDEX IF NOT EXISTS idx_crm_database_grants_active
  ON public.crm_database_grants (broker_user_id, source_database_id)
  WHERE revoked_at IS NULL AND suspended_at IS NULL;

CREATE OR REPLACE FUNCTION public.broker_can_see_lead(
  _user_id uuid,
  _lead_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lead AS (
    SELECT id, source_database_id, created_by_user_id, owner_user_id,
           created_at, pipeline_stage
    FROM public.crm_leads
    WHERE id = _lead_id
  ),
  share AS (
    SELECT 1 FROM public.crm_lead_shares s
    WHERE s.lead_id = _lead_id
      AND s.shared_with = _user_id
      AND s.revoked_at IS NULL
      AND (s.expires_at IS NULL OR s.expires_at > now())
    LIMIT 1
  ),
  grant_match AS (
    SELECT 1
    FROM public.crm_database_grants g
    JOIN lead l ON l.source_database_id = g.source_database_id
    WHERE g.broker_user_id = _user_id
      AND g.revoked_at IS NULL
      AND g.suspended_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at > now())
      AND (
        g.date_window_mode = 'all'
        OR (g.date_window_mode = 'today'    AND l.created_at >= date_trunc('day', now()))
        OR (g.date_window_mode = 'last_7'   AND l.created_at >= now() - interval '7 days')
        OR (g.date_window_mode = 'last_30'  AND l.created_at >= now() - interval '30 days')
        OR (g.date_window_mode = 'custom'
            AND (g.date_window_start IS NULL OR l.created_at >= g.date_window_start)
            AND (g.date_window_end   IS NULL OR l.created_at <= g.date_window_end))
        OR (g.date_window_mode = 'from_date'
            AND (g.date_window_start IS NULL OR l.created_at >= g.date_window_start))
      )
      AND (g.lead_ids IS NULL OR _lead_id = ANY (g.lead_ids))
      AND (g.status_filter IS NULL OR l.pipeline_stage = ANY (g.status_filter))
      AND (
        g.visibility_direction = 'bidirectional'
        OR l.created_by_user_id = _user_id
        OR l.owner_user_id      = _user_id
      )
    LIMIT 1
  )
  SELECT EXISTS (SELECT 1 FROM share) OR EXISTS (SELECT 1 FROM grant_match);
$$;

GRANT EXECUTE ON FUNCTION public.broker_can_see_lead(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS crm_leads_broker_grant_select ON public.crm_leads;
CREATE POLICY crm_leads_broker_grant_select
  ON public.crm_leads
  FOR SELECT
  TO authenticated
  USING (public.broker_can_see_lead(auth.uid(), id));

DROP POLICY IF EXISTS crm_leads_broker_grant_update ON public.crm_leads;
CREATE POLICY crm_leads_broker_grant_update
  ON public.crm_leads
  FOR UPDATE
  TO authenticated
  USING (public.broker_can_see_lead(auth.uid(), id))
  WITH CHECK (public.broker_can_see_lead(auth.uid(), id));

CREATE OR REPLACE FUNCTION public.crm_grants_audit_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.crm_audit_logs (
    actor_user_id, action, entity_type, entity_id,
    old_values, new_values, details
  )
  VALUES (
    auth.uid(),
    'grant_' || lower(TG_OP),
    'crm_database_grants',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
    jsonb_build_object(
      'broker_user_id',       COALESCE(NEW.broker_user_id, OLD.broker_user_id),
      'source_database_id',   COALESCE(NEW.source_database_id, OLD.source_database_id),
      'visibility_direction', COALESCE(NEW.visibility_direction, OLD.visibility_direction),
      'date_window_mode',     COALESCE(NEW.date_window_mode, OLD.date_window_mode),
      'suspended',            (NEW.suspended_at IS NOT NULL),
      'revoked',              (NEW.revoked_at   IS NOT NULL),
      'restricted',           (NEW.restricted_at IS NOT NULL)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS crm_grants_audit ON public.crm_database_grants;
CREATE TRIGGER crm_grants_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.crm_database_grants
  FOR EACH ROW EXECUTE FUNCTION public.crm_grants_audit_trg();
