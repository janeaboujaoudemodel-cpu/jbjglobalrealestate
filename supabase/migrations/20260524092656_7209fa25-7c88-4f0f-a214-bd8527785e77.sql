-- =========================================================
-- 1. Reference code sequence + generator
-- =========================================================
CREATE SEQUENCE IF NOT EXISTS public.verification_ref_seq START 100001;

CREATE OR REPLACE FUNCTION public.generate_verification_ref()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'VRF-' || lpad(nextval('public.verification_ref_seq')::text, 6, '0');
$$;

-- =========================================================
-- 2. Extend user_verifications with bank-grade fields
-- =========================================================
ALTER TABLE public.user_verifications
  ADD COLUMN IF NOT EXISTS reference_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS document_country TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS address JSONB,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS id_back_url TEXT,
  ADD COLUMN IF NOT EXISTS liveness_frames JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS liveness_challenges JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client_ip INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS consent_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC;

-- Backfill reference codes for any existing rows
UPDATE public.user_verifications
SET reference_code = public.generate_verification_ref()
WHERE reference_code IS NULL;

-- Auto-assign reference code on insert if absent
CREATE OR REPLACE FUNCTION public.set_verification_reference_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_code IS NULL THEN
    NEW.reference_code := public.generate_verification_ref();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_verification_ref ON public.user_verifications;
CREATE TRIGGER trg_set_verification_ref
BEFORE INSERT ON public.user_verifications
FOR EACH ROW EXECUTE FUNCTION public.set_verification_reference_code();

-- =========================================================
-- 3. Sync profiles.verification_status whenever status changes
-- =========================================================
CREATE OR REPLACE FUNCTION public.sync_profile_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET verification_status = NEW.status
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_verification_status ON public.user_verifications;
CREATE TRIGGER trg_sync_profile_verification_status
AFTER INSERT OR UPDATE OF status ON public.user_verifications
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification_status();

-- =========================================================
-- 4. Audit log table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.user_verifications(id) ON DELETE CASCADE,
  actor_user_id UUID,
  event TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  client_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_verification_id
  ON public.verification_audit_log(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_created_at
  ON public.verification_audit_log(created_at DESC);

ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Only owner/admin can read; writes only via service role (edge function)
DROP POLICY IF EXISTS "Owner can view verification audit" ON public.verification_audit_log;
CREATE POLICY "Owner can view verification audit"
ON public.verification_audit_log
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- Users may read their own audit trail (their submission events)
DROP POLICY IF EXISTS "Users view own verification audit" ON public.verification_audit_log;
CREATE POLICY "Users view own verification audit"
ON public.verification_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_verifications v
    WHERE v.id = verification_audit_log.verification_id
      AND v.user_id = auth.uid()
  )
);

-- No public INSERT/UPDATE/DELETE policy → only the service role (edge function) can write