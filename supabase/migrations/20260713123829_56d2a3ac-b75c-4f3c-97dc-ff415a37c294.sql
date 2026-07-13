
-- =========================================================
-- 1. Developer custom fields registry
-- =========================================================
CREATE TABLE IF NOT EXISTS public.developer_custom_field_defs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text','longtext','number','url','list','date')),
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai_discovered')),
  discovered_from_developer_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.developer_custom_field_defs TO authenticated;
GRANT ALL ON public.developer_custom_field_defs TO service_role;

ALTER TABLE public.developer_custom_field_defs ENABLE ROW LEVEL SECURITY;

-- read: any authenticated staff can see the registry so the form renders correctly
DROP POLICY IF EXISTS developer_custom_field_defs_read ON public.developer_custom_field_defs;
CREATE POLICY developer_custom_field_defs_read
  ON public.developer_custom_field_defs
  FOR SELECT
  TO authenticated
  USING (true);

-- write: only owner/admin roles via has_role
DROP POLICY IF EXISTS developer_custom_field_defs_write ON public.developer_custom_field_defs;
CREATE POLICY developer_custom_field_defs_write
  ON public.developer_custom_field_defs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.dcfd_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_dcfd_touch ON public.developer_custom_field_defs;
CREATE TRIGGER trg_dcfd_touch
  BEFORE UPDATE ON public.developer_custom_field_defs
  FOR EACH ROW EXECUTE FUNCTION public.dcfd_touch_updated_at();

-- =========================================================
-- 2. Values store on developers
-- =========================================================
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

-- =========================================================
-- 3. Security fix: broker_profiles column-level guard
-- =========================================================
CREATE OR REPLACE FUNCTION public.guard_broker_profiles_privileged_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_privileged BOOLEAN := FALSE;
BEGIN
  -- service role or admin/owner may change anything
  IF (current_setting('request.jwt.claim.role', true) = 'service_role')
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner') THEN
    is_privileged := TRUE;
  END IF;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  -- broker acting on own row: revert privileged columns to OLD values
  NEW.verification_status  := OLD.verification_status;
  NEW.current_tier         := OLD.current_tier;
  NEW.total_points         := OLD.total_points;
  NEW.performance_rating   := OLD.performance_rating;
  NEW.is_active            := OLD.is_active;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_broker_profiles_privileged ON public.broker_profiles;
CREATE TRIGGER trg_guard_broker_profiles_privileged
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_broker_profiles_privileged_fields();

-- =========================================================
-- 4. Security fix: broker_subscriptions billing guard
-- =========================================================
CREATE OR REPLACE FUNCTION public.guard_broker_subscriptions_billing_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_privileged BOOLEAN := FALSE;
BEGIN
  IF (current_setting('request.jwt.claim.role', true) = 'service_role')
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner') THEN
    is_privileged := TRUE;
  END IF;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  NEW.tier             := OLD.tier;
  NEW.status           := OLD.status;
  NEW.price_usd        := OLD.price_usd;
  NEW.ai_credits_limit := OLD.ai_credits_limit;
  NEW.pdf_downloads    := OLD.pdf_downloads;
  NEW.currency         := OLD.currency;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_broker_subscriptions_billing ON public.broker_subscriptions;
CREATE TRIGGER trg_guard_broker_subscriptions_billing
  BEFORE UPDATE ON public.broker_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.guard_broker_subscriptions_billing_fields();

-- =========================================================
-- 5. Security fix: profiles verification/tier guard
-- =========================================================
CREATE OR REPLACE FUNCTION public.guard_profiles_verification_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_privileged BOOLEAN := FALSE;
BEGIN
  IF (current_setting('request.jwt.claim.role', true) = 'service_role')
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'owner') THEN
    is_privileged := TRUE;
  END IF;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  NEW.is_verified         := OLD.is_verified;
  NEW.verification_status := OLD.verification_status;
  NEW.broker_tier         := OLD.broker_tier;
  NEW.client_tier         := OLD.client_tier;
  NEW.first_deal_verified := OLD.first_deal_verified;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_profiles_verification ON public.profiles;
CREATE TRIGGER trg_guard_profiles_verification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_verification_fields();
