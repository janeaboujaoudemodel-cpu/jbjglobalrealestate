
-- =====================================================
-- 1. CRM CATEGORY ENUM
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.crm_category AS ENUM (
    'investor','buyer','seller','broker','developer',
    'landlord','tenant','partner','service_provider','media','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 2. CRM USER PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.crm_category NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  preferred_language text NOT NULL DEFAULT 'English',
  preferred_contact_method text NOT NULL DEFAULT '',
  preferred_contact_time text NOT NULL DEFAULT '',
  services text[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  internal_labels text[] NOT NULL DEFAULT '{}',
  last_login_at timestamptz,
  archived_at timestamptz,
  merged_into_id uuid REFERENCES public.crm_user_profiles(id) ON DELETE SET NULL,
  source_page text NOT NULL DEFAULT '',
  category_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- denormalized filter fields
  position text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  years_experience numeric,
  budget_min numeric,
  budget_max numeric,
  investment_experience text NOT NULL DEFAULT '',
  communities text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_user_profiles TO authenticated;
GRANT ALL ON public.crm_user_profiles TO service_role;

ALTER TABLE public.crm_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_profiles_owner_admin_all" ON public.crm_user_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "crm_profiles_self_read" ON public.crm_user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "crm_profiles_self_update" ON public.crm_user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_crm_profiles_category ON public.crm_user_profiles(category);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_position ON public.crm_user_profiles(position);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_company ON public.crm_user_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_country ON public.crm_user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_status ON public.crm_user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_created ON public.crm_user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_category_data ON public.crm_user_profiles USING GIN (category_data);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_services ON public.crm_user_profiles USING GIN (services);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_communities ON public.crm_user_profiles USING GIN (communities);

CREATE OR REPLACE FUNCTION public.crm_user_profiles_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS crm_user_profiles_updated_at ON public.crm_user_profiles;
CREATE TRIGGER crm_user_profiles_updated_at
BEFORE UPDATE ON public.crm_user_profiles
FOR EACH ROW EXECUTE FUNCTION public.crm_user_profiles_touch();

-- =====================================================
-- 3. NOTES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_profile_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.crm_user_profiles(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_profile_notes TO authenticated;
GRANT ALL ON public.crm_profile_notes TO service_role;

ALTER TABLE public.crm_profile_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_notes_admin_all" ON public.crm_profile_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_crm_notes_profile ON public.crm_profile_notes(profile_id, created_at DESC);

-- =====================================================
-- 4. ACTIVITY TIMELINE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_profile_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.crm_user_profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.crm_profile_activity TO authenticated;
GRANT ALL ON public.crm_profile_activity TO service_role;

ALTER TABLE public.crm_profile_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_activity_admin_read" ON public.crm_profile_activity
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "crm_activity_admin_insert" ON public.crm_profile_activity
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_crm_activity_profile ON public.crm_profile_activity(profile_id, created_at DESC);

-- =====================================================
-- 5. SECURITY FIXES: broker_subscriptions
--    Prevent self-upgrade of tier/status/price/credits.
-- =====================================================
CREATE OR REPLACE FUNCTION public.prevent_broker_subscription_self_upgrade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin boolean;
BEGIN
  is_admin := public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin');
  IF is_admin THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := COALESCE('free', NEW.tier);
    -- Force safe defaults on self-insert
    NEW.tier := 'free';
    NEW.status := 'inactive';
    IF (to_jsonb(NEW) ? 'price_usd') THEN NEW.price_usd := 0; END IF;
    IF (to_jsonb(NEW) ? 'ai_credits_limit') THEN NEW.ai_credits_limit := 0; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.status IS DISTINCT FROM OLD.status
       OR (to_jsonb(NEW) ? 'price_usd' AND NEW.price_usd IS DISTINCT FROM OLD.price_usd)
       OR (to_jsonb(NEW) ? 'ai_credits_limit' AND NEW.ai_credits_limit IS DISTINCT FROM OLD.ai_credits_limit)
    THEN
      RAISE EXCEPTION 'Not allowed to modify subscription tier, status, price, or credits';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_sub_prevent_self ON public.broker_subscriptions;
CREATE TRIGGER trg_broker_sub_prevent_self
BEFORE INSERT OR UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.prevent_broker_subscription_self_upgrade();

-- =====================================================
-- 6. SECURITY FIXES: referral_partners
-- =====================================================
CREATE OR REPLACE FUNCTION public.prevent_referral_partner_self_approve()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_admin boolean;
BEGIN
  is_admin := public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin');
  IF is_admin THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR (to_jsonb(NEW) ? 'commission_rate' AND NEW.commission_rate IS DISTINCT FROM OLD.commission_rate)
       OR (to_jsonb(NEW) ? 'total_earnings_aed' AND NEW.total_earnings_aed IS DISTINCT FROM OLD.total_earnings_aed)
    THEN
      RAISE EXCEPTION 'Not allowed to modify partner status, commission_rate, or total_earnings';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ref_partner_prevent_self ON public.referral_partners;
CREATE TRIGGER trg_ref_partner_prevent_self
BEFORE UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.prevent_referral_partner_self_approve();

-- =====================================================
-- 7. SECURITY FIXES: user_subscriptions
-- =====================================================
CREATE OR REPLACE FUNCTION public.force_user_subscription_pending()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_admin boolean;
BEGIN
  is_admin := public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin');
  IF is_admin THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.tier_id IS DISTINCT FROM OLD.tier_id
    THEN
      RAISE EXCEPTION 'Not allowed to modify subscription status or tier';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_sub_force_pending ON public.user_subscriptions;
CREATE TRIGGER trg_user_sub_force_pending
BEFORE INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.force_user_subscription_pending();
