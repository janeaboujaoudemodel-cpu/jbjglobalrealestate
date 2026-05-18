
-- ============================================================
-- BATCH 2 — Broker invitation, OTP, sessions, device controls
-- Additive only. Safe to roll back by dropping new objects.
-- ============================================================

-- 1. Extend crm_brokers (additive columns) -------------------
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS invitation_status text
    NOT NULL DEFAULT 'not_invited'
    CHECK (invitation_status IN ('not_invited','invited','otp_sent','activated','expired','revoked')),
  ADD COLUMN IF NOT EXISTS invitation_token_hash text,
  ADD COLUMN IF NOT EXISTS invitation_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS otp_hash text,
  ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS must_reset_password boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_by_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_crm_brokers_invitation_token_hash
  ON public.crm_brokers (invitation_token_hash)
  WHERE invitation_token_hash IS NOT NULL;

-- 2. crm_broker_sessions (NEW — no equivalent existed) -------
CREATE TABLE IF NOT EXISTS public.crm_broker_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.crm_brokers(id) ON DELETE CASCADE,
  broker_user_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  session_token_hash text NOT NULL,
  device_fingerprint text,
  device_label text,
  user_agent text,
  ip_address text,
  country text,
  city text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by_user_id uuid,
  revoke_reason text,
  is_suspicious boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_broker_sessions_broker  ON public.crm_broker_sessions(broker_id);
CREATE INDEX IF NOT EXISTS idx_crm_broker_sessions_owner   ON public.crm_broker_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_broker_sessions_active  ON public.crm_broker_sessions(broker_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_crm_broker_sessions_token ON public.crm_broker_sessions(session_token_hash);

ALTER TABLE public.crm_broker_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner sees all broker sessions" ON public.crm_broker_sessions;
CREATE POLICY "Owner sees all broker sessions"
  ON public.crm_broker_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'owner') OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Broker sees own sessions" ON public.crm_broker_sessions;
CREATE POLICY "Broker sees own sessions"
  ON public.crm_broker_sessions FOR SELECT
  USING (broker_user_id = auth.uid());

-- writes restricted to service role (edge functions) — no INSERT/UPDATE/DELETE policies for end users.

-- 3. crm_broker_blocked_devices (NEW) ------------------------
CREATE TABLE IF NOT EXISTS public.crm_broker_blocked_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  broker_id uuid REFERENCES public.crm_brokers(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  reason text,
  blocked_by_user_id uuid NOT NULL,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, broker_id, device_fingerprint)
);

ALTER TABLE public.crm_broker_blocked_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages blocked devices" ON public.crm_broker_blocked_devices;
CREATE POLICY "Owner manages blocked devices"
  ON public.crm_broker_blocked_devices FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR owner_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR owner_id = auth.uid());

-- 4. Audit trigger on session revoke + device block -----------
CREATE OR REPLACE FUNCTION public.crm_broker_session_audit_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
    INSERT INTO public.crm_audit_logs(actor_user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.revoked_by_user_id,
      'broker_session_revoked',
      'crm_broker_session',
      NEW.id,
      jsonb_build_object(
        'broker_id', NEW.broker_id,
        'reason', NEW.revoke_reason,
        'device_fingerprint', NEW.device_fingerprint,
        'ip', NEW.ip_address
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_broker_session_audit ON public.crm_broker_sessions;
CREATE TRIGGER crm_broker_session_audit
  AFTER UPDATE ON public.crm_broker_sessions
  FOR EACH ROW EXECUTE FUNCTION public.crm_broker_session_audit_trg();

CREATE OR REPLACE FUNCTION public.crm_broker_device_audit_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_audit_logs(actor_user_id, action, entity_type, entity_id, details)
    VALUES (NEW.blocked_by_user_id, 'broker_device_blocked', 'crm_broker_device', NEW.id,
            jsonb_build_object('broker_id', NEW.broker_id, 'fingerprint', NEW.device_fingerprint, 'reason', NEW.reason));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.crm_audit_logs(actor_user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'broker_device_unblocked', 'crm_broker_device', OLD.id,
            jsonb_build_object('broker_id', OLD.broker_id, 'fingerprint', OLD.device_fingerprint));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS crm_broker_device_audit ON public.crm_broker_blocked_devices;
CREATE TRIGGER crm_broker_device_audit
  AFTER INSERT OR DELETE ON public.crm_broker_blocked_devices
  FOR EACH ROW EXECUTE FUNCTION public.crm_broker_device_audit_trg();

-- 5. Owner-gated RPCs -----------------------------------------
CREATE OR REPLACE FUNCTION public.crm_broker_revoke_session(_session_id uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.crm_broker_sessions WHERE id = _session_id;
  IF v_owner IS NULL THEN RETURN false; END IF;
  IF NOT (public.has_role(auth.uid(),'owner') OR v_owner = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.crm_broker_sessions
     SET revoked_at = now(), revoked_by_user_id = auth.uid(), revoke_reason = _reason
   WHERE id = _session_id AND revoked_at IS NULL;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_broker_revoke_all_sessions(_broker_id uuid, _reason text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_count integer;
BEGIN
  SELECT owner_id INTO v_owner FROM public.crm_brokers WHERE id = _broker_id;
  IF v_owner IS NULL THEN RETURN 0; END IF;
  IF NOT (public.has_role(auth.uid(),'owner') OR v_owner = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  WITH upd AS (
    UPDATE public.crm_broker_sessions
       SET revoked_at = now(), revoked_by_user_id = auth.uid(), revoke_reason = _reason
     WHERE broker_id = _broker_id AND revoked_at IS NULL
     RETURNING 1
  ) SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_broker_block_device(_broker_id uuid, _fingerprint text, _reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_id uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.crm_brokers WHERE id = _broker_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Broker not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'owner') OR v_owner = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.crm_broker_blocked_devices(owner_id, broker_id, device_fingerprint, reason, blocked_by_user_id)
  VALUES (v_owner, _broker_id, _fingerprint, _reason, auth.uid())
  ON CONFLICT (owner_id, broker_id, device_fingerprint) DO UPDATE SET reason = EXCLUDED.reason
  RETURNING id INTO v_id;
  -- also revoke any active session on that fingerprint
  UPDATE public.crm_broker_sessions
     SET revoked_at = now(), revoked_by_user_id = auth.uid(), revoke_reason = COALESCE(_reason,'device blocked')
   WHERE broker_id = _broker_id AND device_fingerprint = _fingerprint AND revoked_at IS NULL;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_broker_unblock_device(_block_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.crm_broker_blocked_devices WHERE id = _block_id;
  IF v_owner IS NULL THEN RETURN false; END IF;
  IF NOT (public.has_role(auth.uid(),'owner') OR v_owner = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.crm_broker_blocked_devices WHERE id = _block_id;
  RETURN true;
END;
$$;
