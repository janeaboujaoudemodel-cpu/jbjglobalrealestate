
-- =============================================
-- GLOBAL AUDIT EVENTS — Unified immutable sink
-- =============================================
CREATE TABLE public.global_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text,
  source_id text,
  user_id uuid,
  user_email text,
  user_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_name text,
  module text,
  route text,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  criticality text DEFAULT 'medium',
  approval_state text,
  submitted_by uuid,
  reviewed_by uuid,
  approved_by uuid,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for common queries
CREATE INDEX idx_global_audit_created ON public.global_audit_events(created_at DESC);
CREATE INDEX idx_global_audit_module ON public.global_audit_events(module);
CREATE INDEX idx_global_audit_user ON public.global_audit_events(user_id);
CREATE INDEX idx_global_audit_criticality ON public.global_audit_events(criticality);
CREATE INDEX idx_global_audit_entity ON public.global_audit_events(entity_type, entity_id);

-- RLS: Immutable design
ALTER TABLE public.global_audit_events ENABLE ROW LEVEL SECURITY;

-- Owner-only SELECT
CREATE POLICY "owner_select_global_audit"
  ON public.global_audit_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- Authenticated INSERT (service role + direct inserts)
CREATE POLICY "authenticated_insert_global_audit"
  ON public.global_audit_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NO UPDATE policy — immutable
-- NO DELETE policy — immutable

-- =============================================
-- SUSPICIOUS ADMIN ALERTS
-- =============================================
CREATE TABLE public.suspicious_admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  user_id uuid,
  user_email text,
  description text NOT NULL,
  details jsonb,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_suspicious_alerts_created ON public.suspicious_admin_alerts(created_at DESC);
CREATE INDEX idx_suspicious_alerts_ack ON public.suspicious_admin_alerts(acknowledged);

ALTER TABLE public.suspicious_admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_suspicious_alerts"
  ON public.suspicious_admin_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "authenticated_insert_suspicious_alerts"
  ON public.suspicious_admin_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Owner-only acknowledge (update only acknowledged fields)
CREATE POLICY "owner_acknowledge_alerts"
  ON public.suspicious_admin_alerts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- NO DELETE policy

-- =============================================
-- TRIGGER: Sync audit_logs -> global_audit_events
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_sync_audit_logs_to_global()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.global_audit_events (
    source_table, source_id, user_id, user_email,
    action, entity_type, entity_id, module,
    description, metadata, criticality, created_at
  ) VALUES (
    'audit_logs', NEW.id::text, NEW.user_id, NEW.user_email,
    NEW.action_type::text, NEW.resource_type::text, NEW.resource_id,
    COALESCE(NEW.resource_type::text, 'general'),
    NEW.description, NEW.details,
    CASE
      WHEN NEW.action_type::text IN ('delete', 'block', 'unblock') THEN 'high'
      WHEN NEW.action_type::text IN ('create', 'update', 'approve', 'reject') THEN 'medium'
      ELSE 'low'
    END,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_logs_to_global
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_audit_logs_to_global();

-- =============================================
-- TRIGGER: Sync admin_edit_log -> global_audit_events
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_sync_admin_edit_to_global()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.global_audit_events (
    source_table, source_id, user_id,
    action, entity_type, entity_id, entity_name,
    module, changed_fields, description, criticality, created_at
  ) VALUES (
    'admin_edit_log', NEW.id::text, NEW.user_id,
    NEW.action, NEW.entity_type, NEW.entity_id, NEW.entity_name,
    NEW.entity_type,
    NEW.changed_fields, NEW.summary, 'medium',
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_edit_to_global
  AFTER INSERT ON public.admin_edit_log
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_admin_edit_to_global();

-- =============================================
-- FUNCTION: Check suspicious patterns (on-demand)
-- =============================================
CREATE OR REPLACE FUNCTION public.check_suspicious_patterns()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_count integer := 0;
  r record;
BEGIN
  -- 1. Repeated permission changes (>5 in 1 hour)
  FOR r IN
    SELECT user_id, user_email, count(*) as cnt
    FROM public.global_audit_events
    WHERE action IN ('update', 'create', 'delete')
      AND entity_type = 'role'
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id, user_email
    HAVING count(*) > 5
  LOOP
    INSERT INTO public.suspicious_admin_alerts (alert_type, severity, user_id, user_email, description, details)
    VALUES ('repeated_permission_changes', 'high', r.user_id, r.user_email,
      format('User made %s permission changes in the last hour', r.cnt),
      jsonb_build_object('count', r.cnt, 'window', '1 hour'));
    alert_count := alert_count + 1;
  END LOOP;

  -- 2. Mass edits (>20 in 10 minutes)
  FOR r IN
    SELECT user_id, user_email, count(*) as cnt
    FROM public.global_audit_events
    WHERE action IN ('update', 'create')
      AND created_at > now() - interval '10 minutes'
    GROUP BY user_id, user_email
    HAVING count(*) > 20
  LOOP
    INSERT INTO public.suspicious_admin_alerts (alert_type, severity, user_id, user_email, description, details)
    VALUES ('mass_edits', 'high', r.user_id, r.user_email,
      format('User made %s edits in the last 10 minutes', r.cnt),
      jsonb_build_object('count', r.cnt, 'window', '10 minutes'));
    alert_count := alert_count + 1;
  END LOOP;

  -- 3. Multiple deletions (>10 in 1 hour)
  FOR r IN
    SELECT user_id, user_email, count(*) as cnt
    FROM public.global_audit_events
    WHERE action = 'delete'
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id, user_email
    HAVING count(*) > 10
  LOOP
    INSERT INTO public.suspicious_admin_alerts (alert_type, severity, user_id, user_email, description, details)
    VALUES ('multiple_deletions', 'critical', r.user_id, r.user_email,
      format('User deleted %s records in the last hour', r.cnt),
      jsonb_build_object('count', r.cnt, 'window', '1 hour'));
    alert_count := alert_count + 1;
  END LOOP;

  -- 4. Unusual exports (>5 in a day)
  FOR r IN
    SELECT user_id, user_email, count(*) as cnt
    FROM public.global_audit_events
    WHERE action = 'export'
      AND created_at > now() - interval '24 hours'
    GROUP BY user_id, user_email
    HAVING count(*) > 5
  LOOP
    INSERT INTO public.suspicious_admin_alerts (alert_type, severity, user_id, user_email, description, details)
    VALUES ('unusual_exports', 'medium', r.user_id, r.user_email,
      format('User exported %s times in the last 24 hours', r.cnt),
      jsonb_build_object('count', r.cnt, 'window', '24 hours'));
    alert_count := alert_count + 1;
  END LOOP;

  -- 5. Odd hours activity (outside 6AM-11PM UAE = UTC+4)
  FOR r IN
    SELECT user_id, user_email, count(*) as cnt
    FROM public.global_audit_events
    WHERE created_at > now() - interval '24 hours'
      AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Dubai') NOT BETWEEN 6 AND 23
    GROUP BY user_id, user_email
    HAVING count(*) > 3
  LOOP
    INSERT INTO public.suspicious_admin_alerts (alert_type, severity, user_id, user_email, description, details)
    VALUES ('odd_hours_activity', 'medium', r.user_id, r.user_email,
      format('User had %s actions during odd hours (midnight-6AM UAE)', r.cnt),
      jsonb_build_object('count', r.cnt, 'window', '24 hours'));
    alert_count := alert_count + 1;
  END LOOP;

  -- 6. Publish/revert cycles (>3 in 1 hour)
  FOR r IN
    SELECT user_id, user_email, count(*) as cnt
    FROM public.global_audit_events
    WHERE action IN ('publish', 'revert')
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id, user_email
    HAVING count(*) > 3
  LOOP
    INSERT INTO public.suspicious_admin_alerts (alert_type, severity, user_id, user_email, description, details)
    VALUES ('publish_revert_cycle', 'high', r.user_id, r.user_email,
      format('User had %s publish/revert actions in the last hour', r.cnt),
      jsonb_build_object('count', r.cnt, 'window', '1 hour'));
    alert_count := alert_count + 1;
  END LOOP;

  RETURN alert_count;
END;
$$;
