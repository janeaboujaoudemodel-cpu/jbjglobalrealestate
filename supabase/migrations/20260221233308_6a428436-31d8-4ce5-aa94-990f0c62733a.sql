
-- =============================================
-- FIX 1: Add default to event_time so inserts don't fail
-- =============================================
ALTER TABLE public.user_events ALTER COLUMN event_time SET DEFAULT now();

-- =============================================
-- FIX 2: Attach triggers to user_events
-- =============================================
CREATE TRIGGER trg_award_points
  BEFORE INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_event();

CREATE TRIGGER trg_upsert_daily
  AFTER INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_daily_activity();

-- =============================================
-- NEW: Conversion probability + revenue prediction fields on user_interest_profile
-- =============================================
ALTER TABLE public.user_interest_profile
  ADD COLUMN IF NOT EXISTS conversion_probability numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_potential numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_ticket_aed numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_to_conversion_days integer DEFAULT 90,
  ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_tier text DEFAULT 'Visitor',
  ADD COLUMN IF NOT EXISTS vip_tier_reason text,
  ADD COLUMN IF NOT EXISTS vip_override boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vip_override_by uuid,
  ADD COLUMN IF NOT EXISTS lead_count_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves_count_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compares_count_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_clicks_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_last_7d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feature_diversity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS searches_30d integer DEFAULT 0;

-- =============================================
-- NEW: Campaign segmentation tables
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','archived')),
  segment_rules jsonb DEFAULT '[]'::jsonb,
  audience_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  launched_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TABLE IF NOT EXISTS public.campaign_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  matched_at timestamptz DEFAULT now(),
  match_reason text,
  removed_at timestamptz,
  send_status text DEFAULT 'pending',
  sent_at timestamptz,
  send_result jsonb
);

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaign members" ON public.campaign_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON public.campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON public.campaign_members(user_id);

-- =============================================
-- NEW: VIP Reservation System
-- =============================================
CREATE TABLE IF NOT EXISTS public.vip_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reservation_type text NOT NULL CHECK (reservation_type IN ('private_viewing','investment_call','legal_consult','mortgage_consult','concierge_service','private_tour')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  preferred_date timestamptz,
  notes text,
  assigned_staff_id uuid,
  assigned_staff_name text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vip_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations" ON public.vip_reservations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create reservations" ON public.vip_reservations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all reservations" ON public.vip_reservations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- =============================================
-- NEW: Commission rates config
-- =============================================
CREATE TABLE IF NOT EXISTS public.commission_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type text UNIQUE NOT NULL,
  rate_percent numeric NOT NULL DEFAULT 2.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage commission rates" ON public.commission_rates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Authenticated can read commission rates" ON public.commission_rates
  FOR SELECT TO authenticated USING (true);

-- Seed default commission rates
INSERT INTO public.commission_rates (property_type, rate_percent) VALUES
  ('off_plan', 5.0),
  ('secondary_resale', 2.0),
  ('rental', 5.0)
ON CONFLICT (property_type) DO NOTHING;

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_events_user_time ON public.user_events(user_id, event_time);
CREATE INDEX IF NOT EXISTS idx_user_events_session_time ON public.user_events(session_id, event_time);
CREATE INDEX IF NOT EXISTS idx_user_events_name ON public.user_events(event_name);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON public.user_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_user_daily_user_date ON public.user_daily_activity(user_id, day_date);
