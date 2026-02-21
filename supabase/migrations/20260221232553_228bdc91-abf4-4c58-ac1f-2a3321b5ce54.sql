
-- ========================================================
-- JBJ GLOBAL REAL ESTATE — USER ACTIVITY INTELLIGENCE SCHEMA
-- ========================================================

-- 1. USER_SESSIONS — tracks every login/session
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds int DEFAULT 0,
  device_type text, -- mobile/desktop/tablet
  os text,
  browser text,
  user_agent text,
  ip_hash text, -- never store raw IP
  country text,
  city text,
  timezone text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  is_authenticated boolean DEFAULT false,
  pages_visited int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions(started_at);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can update own session" ON public.user_sessions FOR UPDATE USING (true);
CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 2. USER_EVENTS — tracks all activity events
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  event_time timestamptz NOT NULL DEFAULT now(),
  event_name text NOT NULL,
  page_path text,
  element_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  points_awarded int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_time ON public.user_events(user_id, event_time);
CREATE INDEX IF NOT EXISTS idx_user_events_session_time ON public.user_events(session_id, event_time);
CREATE INDEX IF NOT EXISTS idx_user_events_name ON public.user_events(event_name);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON public.user_events(created_at);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events" ON public.user_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own events" ON public.user_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all events" ON public.user_events FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 3. USER_DAILY_ACTIVITY — daily rollup
CREATE TABLE IF NOT EXISTS public.user_daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_date date NOT NULL,
  sessions_count int DEFAULT 0,
  total_duration_seconds int DEFAULT 0,
  total_events int DEFAULT 0,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  points_earned int DEFAULT 0,
  streak_day_number int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_user_date ON public.user_daily_activity(user_id, day_date);

ALTER TABLE public.user_daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily activity" ON public.user_daily_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert daily activity" ON public.user_daily_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update daily activity" ON public.user_daily_activity FOR UPDATE USING (true);
CREATE POLICY "Admins can view all daily activity" ON public.user_daily_activity FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 4. USER_POINTS_LEDGER — points tracking
CREATE TABLE IF NOT EXISTS public.user_points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.user_events(id),
  points int NOT NULL DEFAULT 0,
  reason text NOT NULL,
  daily_total int DEFAULT 0, -- running daily total for cap enforcement
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON public.user_points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_created ON public.user_points_ledger(created_at);

ALTER TABLE public.user_points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON public.user_points_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points" ON public.user_points_ledger FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all points" ON public.user_points_ledger FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 5. USER_INTEREST_PROFILE — behavioral intelligence
CREATE TABLE IF NOT EXISTS public.user_interest_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  avg_budget_estimate numeric,
  preferred_areas text[] DEFAULT '{}',
  preferred_property_types text[] DEFAULT '{}',
  preferred_bedrooms int[],
  engagement_score numeric DEFAULT 0,
  intent_score numeric DEFAULT 0,
  device_mix jsonb DEFAULT '{}'::jsonb,
  top_pages text[] DEFAULT '{}',
  tools_used text[] DEFAULT '{}',
  total_sessions int DEFAULT 0,
  total_time_seconds int DEFAULT 0,
  total_points int DEFAULT 0,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_active_at timestamptz,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_interest_user ON public.user_interest_profile(user_id);

ALTER TABLE public.user_interest_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_interest_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can upsert profile" ON public.user_interest_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update profile" ON public.user_interest_profile FOR UPDATE USING (true);
CREATE POLICY "Admins can view all profiles" ON public.user_interest_profile FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 6. POINTS RULES CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.activity_points_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL UNIQUE,
  points int NOT NULL DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_points_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read points config" ON public.activity_points_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage points config" ON public.activity_points_config FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Seed points rules
INSERT INTO public.activity_points_config (event_name, points, description) VALUES
  ('page_view', 1, 'Viewed a page'),
  ('listing_view', 3, 'Viewed a property listing'),
  ('search', 2, 'Performed a search'),
  ('filter_change', 5, 'Applied a filter'),
  ('listing_save', 10, 'Saved a listing'),
  ('compare_used', 15, 'Used comparison tool'),
  ('ai_tool_used', 20, 'Used AI tool'),
  ('lead_submit', 30, 'Submitted a lead/inquiry'),
  ('click_call', 5, 'Clicked call button'),
  ('click_whatsapp', 5, 'Clicked WhatsApp button'),
  ('click_email', 5, 'Clicked email button'),
  ('login', 5, 'Daily login bonus'),
  ('form_submission', 10, 'Submitted a form'),
  ('tool_use', 15, 'Used a platform tool'),
  ('property_view', 3, 'Viewed property detail'),
  ('community_view', 2, 'Viewed area/community'),
  ('favorite', 10, 'Added to favorites'),
  ('click', 1, 'General click interaction'),
  ('role_selection', 2, 'Selected user role'),
  ('download', 10, 'Downloaded a document')
ON CONFLICT (event_name) DO NOTHING;

-- 7. DB FUNCTION: Auto-award points on event insert
CREATE OR REPLACE FUNCTION public.award_points_on_event()
RETURNS TRIGGER AS $$
DECLARE
  _points int;
  _daily_total int;
  _daily_cap int := 300;
BEGIN
  -- Skip if no user_id (anonymous)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up points for this event
  SELECT points INTO _points
  FROM public.activity_points_config
  WHERE event_name = NEW.event_name AND is_active = true;

  IF _points IS NULL OR _points = 0 THEN
    RETURN NEW;
  END IF;

  -- Check daily cap
  SELECT COALESCE(SUM(points), 0) INTO _daily_total
  FROM public.user_points_ledger
  WHERE user_id = NEW.user_id
    AND created_at::date = CURRENT_DATE;

  IF _daily_total >= _daily_cap THEN
    -- Cap reached, award 0
    NEW.points_awarded := 0;
    RETURN NEW;
  END IF;

  -- Clamp to remaining cap
  IF _daily_total + _points > _daily_cap THEN
    _points := _daily_cap - _daily_total;
  END IF;

  NEW.points_awarded := _points;

  -- Insert into ledger
  INSERT INTO public.user_points_ledger (user_id, event_id, points, reason, daily_total)
  VALUES (NEW.user_id, NEW.id, _points, NEW.event_name, _daily_total + _points);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_award_points_on_event
  BEFORE INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_event();

-- 8. DB FUNCTION: Upsert daily activity on event insert
CREATE OR REPLACE FUNCTION public.upsert_daily_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_daily_activity (user_id, day_date, total_events, points_earned, first_seen_at, last_seen_at)
  VALUES (NEW.user_id, CURRENT_DATE, 1, COALESCE(NEW.points_awarded, 0), now(), now())
  ON CONFLICT (user_id, day_date)
  DO UPDATE SET
    total_events = user_daily_activity.total_events + 1,
    points_earned = user_daily_activity.points_earned + COALESCE(NEW.points_awarded, 0),
    last_seen_at = now(),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_upsert_daily_activity
  AFTER INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_daily_activity();
