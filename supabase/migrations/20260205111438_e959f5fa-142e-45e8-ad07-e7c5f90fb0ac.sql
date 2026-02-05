-- =============================================
-- PHASE 6: Tiers & Points System
-- Tasks 10-11: Tier definitions + Points scoring engine
-- =============================================

-- 1) Create tier_definitions table for both brokers and clients
CREATE TABLE IF NOT EXISTS public.tier_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_type TEXT NOT NULL CHECK (tier_type IN ('broker', 'client')),
  tier_name TEXT NOT NULL,
  tier_order INT NOT NULL,
  min_points INT NOT NULL DEFAULT 0,
  max_points INT, -- NULL means unlimited
  badge_color TEXT DEFAULT '#D4AF37',
  benefits JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tier_type, tier_name)
);

-- 2) Create points_config table for scoring rules
CREATE TABLE IF NOT EXISTS public.points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE,
  points_value INT NOT NULL,
  max_daily INT, -- Maximum times this can be earned per day (NULL = unlimited)
  max_monthly INT, -- Maximum times per month (NULL = unlimited)
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Add tier tracking columns to broker_profiles
ALTER TABLE public.broker_profiles 
ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'Starter',
ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMPTZ DEFAULT now();

-- 4) Create user_tier_history table for tracking progression
CREATE TABLE IF NOT EXISTS public.user_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier_type TEXT NOT NULL,
  old_tier TEXT,
  new_tier TEXT NOT NULL,
  points_at_change INT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Enable RLS
ALTER TABLE public.tier_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tier_history ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies for tier_definitions (public read)
CREATE POLICY "tier_definitions_select_all" ON public.tier_definitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tier_definitions_admin_manage" ON public.tier_definitions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7) RLS Policies for points_config (public read)
CREATE POLICY "points_config_select_all" ON public.points_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "points_config_admin_manage" ON public.points_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8) RLS Policies for user_tier_history
CREATE POLICY "user_tier_history_select_own" ON public.user_tier_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_tier_history_admin_select" ON public.user_tier_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 9) Insert Broker Tier Definitions (Starter, Rising, Performer, Elite, Legend)
INSERT INTO public.tier_definitions (tier_type, tier_name, tier_order, min_points, max_points, badge_color, benefits) VALUES
  ('broker', 'Starter', 1, 0, 499, '#6B7280', '["Access to basic training modules", "Standard support", "Basic marketing tools"]'::jsonb),
  ('broker', 'Rising', 2, 500, 1499, '#10B981', '["All Starter benefits", "Priority email support", "Advanced training access", "50% commission boost on first 3 deals"]'::jsonb),
  ('broker', 'Performer', 3, 1500, 3999, '#3B82F6', '["All Rising benefits", "Dedicated account manager", "Premium AI tools access", "Featured broker listing"]'::jsonb),
  ('broker', 'Elite', 4, 4000, 9999, '#8B5CF6', '["All Performer benefits", "VIP client introductions", "Exclusive launches access", "Personal branding support"]'::jsonb),
  ('broker', 'Legend', 5, 10000, NULL, '#D4AF37', '["All Elite benefits", "Revenue sharing program", "Speaking opportunities", "Advisory board invitation"]'::jsonb)
ON CONFLICT (tier_type, tier_name) DO UPDATE SET
  min_points = EXCLUDED.min_points,
  max_points = EXCLUDED.max_points,
  benefits = EXCLUDED.benefits;

-- 10) Insert Client Tier Definitions
INSERT INTO public.tier_definitions (tier_type, tier_name, tier_order, min_points, max_points, badge_color, benefits) VALUES
  ('client', 'Explorer', 1, 0, 199, '#6B7280', '["Property alerts", "Market reports access", "Basic consultation"]'::jsonb),
  ('client', 'Seeker', 2, 200, 499, '#10B981', '["All Explorer benefits", "Priority viewings", "Exclusive listings preview"]'::jsonb),
  ('client', 'Investor', 3, 500, 1499, '#3B82F6', '["All Seeker benefits", "Investment analysis reports", "ROI calculator access", "Dedicated advisor"]'::jsonb),
  ('client', 'Premium', 4, 1500, 3999, '#8B5CF6', '["All Investor benefits", "VIP launches access", "Legal consultation credit", "Concierge service"]'::jsonb),
  ('client', 'Elite', 5, 4000, NULL, '#D4AF37', '["All Premium benefits", "Private off-market deals", "Annual property review", "Priority Golden Visa support"]'::jsonb)
ON CONFLICT (tier_type, tier_name) DO UPDATE SET
  min_points = EXCLUDED.min_points,
  max_points = EXCLUDED.max_points,
  benefits = EXCLUDED.benefits;

-- 11) Insert Points Configuration (BALANCED - Deal closure is most valuable)
INSERT INTO public.points_config (event_type, points_value, max_daily, max_monthly, description) VALUES
  -- High-value events (deals)
  ('deal_closed', 500, NULL, NULL, 'Closing a verified deal'),
  ('deal_closed_premium', 750, NULL, NULL, 'Closing a premium property deal (>5M AED)'),
  
  -- Referral events
  ('referral_broker_signup', 100, NULL, NULL, 'Referring a new broker who signs up'),
  ('referral_broker_first_deal', 250, NULL, NULL, 'Referred broker closes first deal (+ 5% commission)'),
  ('referral_client', 50, NULL, NULL, 'Referring a new client'),
  
  -- Training & Education (moderate value)
  ('training_module_complete', 50, 3, 20, 'Completing a training module'),
  ('certification_earned', 200, NULL, 2, 'Earning a certification'),
  ('book_chapter_read', 10, 5, 30, 'Reading a book chapter'),
  
  -- Site visits (capped to prevent gaming)
  ('developer_visit_checkin', 30, 2, 15, 'Checking in at developer site'),
  ('client_meeting_logged', 20, 3, 20, 'Logging a client meeting'),
  
  -- Daily activities (low value, heavily capped)
  ('daily_login', 5, 1, 20, 'Daily platform login'),
  ('profile_complete', 25, NULL, 1, 'Completing profile 100%'),
  ('listing_created', 15, 5, 30, 'Creating a property listing'),
  
  -- Engagement
  ('review_received', 30, NULL, 10, 'Receiving a client review'),
  ('event_attendance', 40, NULL, 8, 'Attending a JBJ event')
ON CONFLICT (event_type) DO UPDATE SET
  points_value = EXCLUDED.points_value,
  max_daily = EXCLUDED.max_daily,
  max_monthly = EXCLUDED.max_monthly,
  description = EXCLUDED.description;

-- 12) Function to calculate user tier based on points
CREATE OR REPLACE FUNCTION public.calculate_user_tier(p_user_id UUID, p_tier_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points INT;
  v_tier_name TEXT;
BEGIN
  -- Get total points for user
  SELECT COALESCE(SUM(points_delta), 0) INTO v_total_points
  FROM public.points_ledger
  WHERE user_id = p_user_id;

  -- Find matching tier
  SELECT tier_name INTO v_tier_name
  FROM public.tier_definitions
  WHERE tier_type = p_tier_type
    AND min_points <= v_total_points
    AND (max_points IS NULL OR max_points >= v_total_points)
    AND is_active = true
  ORDER BY tier_order DESC
  LIMIT 1;

  RETURN COALESCE(v_tier_name, CASE WHEN p_tier_type = 'broker' THEN 'Starter' ELSE 'Explorer' END);
END;
$$;

-- 13) Function to get user's total points
CREATE OR REPLACE FUNCTION public.get_user_total_points(p_user_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points_delta), 0)::INT
  FROM public.points_ledger
  WHERE user_id = p_user_id;
$$;

-- 14) Function to check if user can earn points for event (respects daily/monthly caps)
CREATE OR REPLACE FUNCTION public.can_earn_points(p_user_id UUID, p_event_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_daily_count INT;
  v_monthly_count INT;
BEGIN
  SELECT * INTO v_config FROM public.points_config WHERE event_type = p_event_type AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check daily cap
  IF v_config.max_daily IS NOT NULL THEN
    SELECT COUNT(*) INTO v_daily_count
    FROM public.points_ledger
    WHERE user_id = p_user_id
      AND event_type = p_event_type
      AND created_at >= CURRENT_DATE;
    
    IF v_daily_count >= v_config.max_daily THEN
      RETURN false;
    END IF;
  END IF;

  -- Check monthly cap
  IF v_config.max_monthly IS NOT NULL THEN
    SELECT COUNT(*) INTO v_monthly_count
    FROM public.points_ledger
    WHERE user_id = p_user_id
      AND event_type = p_event_type
      AND created_at >= date_trunc('month', CURRENT_DATE);
    
    IF v_monthly_count >= v_config.max_monthly THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- 15) Function to award points with validation
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_ref_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points_value INT;
  v_current_balance INT;
  v_new_balance INT;
BEGIN
  -- Check if user can earn points
  IF NOT public.can_earn_points(p_user_id, p_event_type) THEN
    RETURN 0;
  END IF;

  -- Get points value
  SELECT points_value INTO v_points_value
  FROM public.points_config
  WHERE event_type = p_event_type AND is_active = true;

  IF v_points_value IS NULL THEN
    RETURN 0;
  END IF;

  -- Get current balance
  SELECT COALESCE(SUM(points_delta), 0) INTO v_current_balance
  FROM public.points_ledger
  WHERE user_id = p_user_id;

  v_new_balance := v_current_balance + v_points_value;

  -- Insert ledger entry
  INSERT INTO public.points_ledger (user_id, event_type, event_ref_id, event_description, points_delta, points_balance_after)
  VALUES (p_user_id, p_event_type, p_event_ref_id, COALESCE(p_description, p_event_type), v_points_value, v_new_balance);

  -- Update broker_profiles if applicable
  UPDATE public.broker_profiles
  SET total_points = v_new_balance,
      current_tier = public.calculate_user_tier(p_user_id, 'broker'),
      tier_updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_points_value;
END;
$$;