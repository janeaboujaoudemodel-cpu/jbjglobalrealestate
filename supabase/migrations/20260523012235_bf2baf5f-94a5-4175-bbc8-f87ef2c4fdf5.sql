-- =========================================================================
-- DEVELOPERS PORTAL — Phase 1 foundation
-- =========================================================================

-- 1) Extend app_role enum (idempotent)
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'portal_developer';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'portal_rep';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Extend developer_sales_reps with portal-specific columns
ALTER TABLE public.developer_sales_reps
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS assigned_emirates text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available','busy','off'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_sales_reps_auth_user
  ON public.developer_sales_reps(auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_developer_sales_reps_emirates
  ON public.developer_sales_reps USING GIN (assigned_emirates);

-- 3) Helper: who is portal owner (existing owner role)
CREATE OR REPLACE FUNCTION public.is_portal_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'owner'::public.app_role)
      OR public.has_role(_uid, 'admin'::public.app_role);
$$;

-- Helper: this user owns a rep row
CREATE OR REPLACE FUNCTION public.portal_rep_owns(_uid uuid, _rep_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.developer_sales_reps r
                 WHERE r.id = _rep_id AND r.auth_user_id = _uid);
$$;

-- =========================================================================
-- 4) NEW TABLES
-- =========================================================================

-- 4a) Sales-rep self-serve applications
CREATE TABLE IF NOT EXISTS public.developer_rep_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone_e164 text,
  nationality text,
  position text,
  languages text[] NOT NULL DEFAULT '{}'::text[],
  assigned_emirates text[] NOT NULL DEFAULT '{}'::text[],
  requested_developer_id uuid REFERENCES public.uae_developers(id) ON DELETE SET NULL,
  requested_developer_name text,
  message text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','denied','withdrawn')),
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_rep_id uuid REFERENCES public.developer_sales_reps(id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rep_apps_status ON public.developer_rep_applications(status);
ALTER TABLE public.developer_rep_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY rep_apps_owner_all ON public.developer_rep_applications
  FOR ALL TO authenticated
  USING (public.is_portal_owner(auth.uid()))
  WITH CHECK (public.is_portal_owner(auth.uid()));

-- Anyone (including anon) may create a single application; reading is owner-only
CREATE POLICY rep_apps_public_insert ON public.developer_rep_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND decided_by IS NULL AND decided_at IS NULL);

-- 4b) Broker → rep access requests
CREATE TABLE IF NOT EXISTS public.developer_rep_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_id uuid REFERENCES public.uae_developers(id) ON DELETE SET NULL,
  developer_name text,
  rep_id uuid REFERENCES public.developer_sales_reps(id) ON DELETE SET NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','denied','revoked')),
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rep_access_broker ON public.developer_rep_access_requests(broker_id, status);
CREATE INDEX IF NOT EXISTS idx_rep_access_rep ON public.developer_rep_access_requests(rep_id, status);
ALTER TABLE public.developer_rep_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY rep_access_owner_all ON public.developer_rep_access_requests
  FOR ALL TO authenticated
  USING (public.is_portal_owner(auth.uid()))
  WITH CHECK (public.is_portal_owner(auth.uid()));

CREATE POLICY rep_access_broker_own_select ON public.developer_rep_access_requests
  FOR SELECT TO authenticated
  USING (broker_id = auth.uid());

CREATE POLICY rep_access_broker_own_insert ON public.developer_rep_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (broker_id = auth.uid() AND status = 'pending'
              AND decided_by IS NULL AND decided_at IS NULL);

CREATE POLICY rep_access_rep_target_select ON public.developer_rep_access_requests
  FOR SELECT TO authenticated
  USING (rep_id IS NOT NULL AND public.portal_rep_owns(auth.uid(), rep_id));

-- 4c) Rep availability slots
CREATE TABLE IF NOT EXISTS public.developer_rep_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES public.developer_sales_reps(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_rep_avail_rep_time
  ON public.developer_rep_availability(rep_id, starts_at);
ALTER TABLE public.developer_rep_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY rep_avail_owner_all ON public.developer_rep_availability
  FOR ALL TO authenticated
  USING (public.is_portal_owner(auth.uid()))
  WITH CHECK (public.is_portal_owner(auth.uid()));

CREATE POLICY rep_avail_rep_own_all ON public.developer_rep_availability
  FOR ALL TO authenticated
  USING (public.portal_rep_owns(auth.uid(), rep_id))
  WITH CHECK (public.portal_rep_owns(auth.uid(), rep_id));

-- Approved brokers can read availability for reps they have approved access to
CREATE POLICY rep_avail_broker_read ON public.developer_rep_availability
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_rep_access_requests ar
    WHERE ar.rep_id = developer_rep_availability.rep_id
      AND ar.broker_id = auth.uid()
      AND ar.status = 'approved'
      AND (ar.expires_at IS NULL OR ar.expires_at > now())
  ));

-- 4d) Confirmed bookings — owner/broker only
CREATE TABLE IF NOT EXISTS public.developer_rep_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES public.developer_sales_reps(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_role text NOT NULL CHECK (requester_role IN ('owner','broker')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_rep_bookings_rep_time
  ON public.developer_rep_bookings(rep_id, starts_at);
ALTER TABLE public.developer_rep_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY rep_book_owner_all ON public.developer_rep_bookings
  FOR ALL TO authenticated
  USING (public.is_portal_owner(auth.uid()))
  WITH CHECK (public.is_portal_owner(auth.uid()));

CREATE POLICY rep_book_requester_own ON public.developer_rep_bookings
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY rep_book_rep_view ON public.developer_rep_bookings
  FOR SELECT TO authenticated
  USING (public.portal_rep_owns(auth.uid(), rep_id));

-- Insert is restricted to edge function (service role) — no client INSERT policy

-- 4e) Portal audit log
CREATE TABLE IF NOT EXISTS public.developer_portal_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portal_audit_actor ON public.developer_portal_audit(actor_id, created_at DESC);
ALTER TABLE public.developer_portal_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY portal_audit_owner_read ON public.developer_portal_audit
  FOR SELECT TO authenticated USING (public.is_portal_owner(auth.uid()));

-- =========================================================================
-- 5) updated_at triggers
-- =========================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'developer_rep_applications',
    'developer_rep_access_requests',
    'developer_rep_availability',
    'developer_rep_bookings'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
       CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
      t, t, t, t
    );
  END LOOP;
END $$;