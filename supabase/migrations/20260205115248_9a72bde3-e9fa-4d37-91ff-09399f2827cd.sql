-- Migration 1: Points System Rebalance + Deal Bonuses + Monthly Draws + Certification + Tests + Translations + Ledger Enhancement

-- ============================================
-- PART 1: Enhance points_config for deal tiers
-- ============================================

-- Add new columns to points_config
ALTER TABLE public.points_config 
ADD COLUMN IF NOT EXISTS max_weekly INTEGER,
ADD COLUMN IF NOT EXISTS deal_value_min NUMERIC,
ADD COLUMN IF NOT EXISTS deal_value_max NUMERIC;

-- Update existing points values for rebalancing
UPDATE public.points_config SET points_value = 3000, max_monthly = 50 WHERE event_type = 'deal_closed';
UPDATE public.points_config SET points_value = 5000 WHERE event_type = 'deal_closed_premium';
UPDATE public.points_config SET points_value = 5, max_daily = 1, max_monthly = 20 WHERE event_type = 'daily_login';
UPDATE public.points_config SET points_value = 30, max_daily = 2, max_monthly = 15 WHERE event_type = 'developer_visit_checkin';
UPDATE public.points_config SET points_value = 50, max_daily = 3, max_monthly = 10 WHERE event_type = 'training_module_complete';

-- Insert deal tier rows
INSERT INTO public.points_config (event_type, points_value, description, is_active, deal_value_min, deal_value_max, max_monthly)
VALUES 
  ('deal_closed_standard', 3000, 'Deal closed - Standard tier (up to 1M AED)', true, 0, 1000000, 50),
  ('deal_closed_premium_tier', 5000, 'Deal closed - Premium tier (1M-5M AED)', true, 1000001, 5000000, 50),
  ('deal_closed_ultra', 8000, 'Deal closed - Ultra Premium tier (5M-15M AED)', true, 5000001, 15000000, 50),
  ('deal_closed_elite', 12000, 'Deal closed - Elite tier (15M+ AED)', true, 15000001, null, 50)
ON CONFLICT (event_type) DO UPDATE SET 
  points_value = EXCLUDED.points_value,
  deal_value_min = EXCLUDED.deal_value_min,
  deal_value_max = EXCLUDED.deal_value_max;

-- ============================================
-- PART 2: Deal Bonus Thresholds
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_bonus_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_name TEXT NOT NULL,
  required_deal_points INTEGER NOT NULL,
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('cash', 'hardware')),
  bonus_value_aed NUMERIC,
  bonus_description TEXT,
  hardware_item TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_bonus_thresholds ENABLE ROW LEVEL SECURITY;

-- Public read access for bonus thresholds
CREATE POLICY "Anyone can view bonus thresholds" ON public.deal_bonus_thresholds
  FOR SELECT USING (true);

-- Insert default bonus thresholds
INSERT INTO public.deal_bonus_thresholds (threshold_name, required_deal_points, bonus_type, bonus_value_aed, bonus_description, sort_order)
VALUES 
  ('Bronze', 10000, 'cash', 2000, 'AED 2,000 cash bonus for reaching 10,000 deal points', 1),
  ('Silver', 25000, 'cash', 3000, 'AED 3,000 cash bonus for reaching 25,000 deal points', 2),
  ('Gold', 50000, 'cash', 5000, 'AED 5,000 cash bonus for reaching 50,000 deal points', 3),
  ('Platinum', 100000, 'cash', 10000, 'AED 10,000 cash bonus OR iPhone for reaching 100,000 deal points', 4),
  ('Diamond', 200000, 'hardware', null, 'Premium laptop for reaching 200,000 deal points', 5);

UPDATE public.deal_bonus_thresholds SET hardware_item = 'iPhone 15 Pro' WHERE threshold_name = 'Platinum';
UPDATE public.deal_bonus_thresholds SET hardware_item = 'MacBook Pro 14"' WHERE threshold_name = 'Diamond';

-- ============================================
-- PART 3: Broker Bonus Claims
-- ============================================

CREATE TABLE IF NOT EXISTS public.broker_bonus_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  threshold_id UUID REFERENCES public.deal_bonus_thresholds(id),
  deal_points_at_claim INTEGER NOT NULL,
  bonus_status TEXT DEFAULT 'pending' CHECK (bonus_status IN ('pending', 'approved', 'paid', 'rejected')),
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_bonus_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view own bonus claims" ON public.broker_bonus_claims
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own claims
CREATE POLICY "Users can create own bonus claims" ON public.broker_bonus_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 4: Monthly Draws
-- ============================================

CREATE TABLE IF NOT EXISTS public.monthly_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_month INTEGER NOT NULL CHECK (draw_month >= 1 AND draw_month <= 12),
  draw_year INTEGER NOT NULL,
  prize_description TEXT NOT NULL,
  min_activity_points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  winner_user_id UUID,
  drawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draw_month, draw_year)
);

-- Enable RLS
ALTER TABLE public.monthly_draws ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view monthly draws" ON public.monthly_draws
  FOR SELECT USING (true);

-- ============================================
-- PART 5: Draw Entries
-- ============================================

CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.monthly_draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  entry_source TEXT NOT NULL CHECK (entry_source IN ('auto_qualify', 'manual', 'bonus_entry')),
  activity_points_at_entry INTEGER NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(draw_id, user_id)
);

-- Enable RLS
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own entries
CREATE POLICY "Users can view own draw entries" ON public.draw_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can create own draw entries" ON public.draw_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 6: Certification Phases
-- ============================================

CREATE TABLE IF NOT EXISTS public.certification_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  required_book_ids UUID[],
  pass_threshold_percent INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certification_phases ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view certification phases" ON public.certification_phases
  FOR SELECT USING (true);

-- Insert initial phases
INSERT INTO public.certification_phases (phase_number, title, description, sort_order)
VALUES 
  (1, 'Foundation Certification', 'Complete foundational training modules and pass the assessment', 1),
  (2, 'Advisory Certification', 'Master buyer, seller, and landlord advisory skills', 2),
  (3, 'Market Intelligence Certification', 'Demonstrate expertise in market analysis and trends', 3),
  (4, 'Advanced Broker Certification', 'Complete advanced training and earn full certification', 4);

-- ============================================
-- PART 7: User Certification Progress
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_certification_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phase_id UUID NOT NULL REFERENCES public.certification_phases(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'test_pending', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, phase_id)
);

-- Enable RLS
ALTER TABLE public.user_certification_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own certification progress" ON public.user_certification_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own progress
CREATE POLICY "Users can manage own certification progress" ON public.user_certification_progress
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PART 8: Module Questions (Test Bank)
-- ============================================

CREATE TABLE IF NOT EXISTS public.module_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.broker_education_modules(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_questions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view questions
CREATE POLICY "Authenticated users can view questions" ON public.module_questions
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- PART 9: Test Attempts
-- ============================================

CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.broker_education_modules(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  questions_shown UUID[],
  answers_given JSONB,
  score_percent NUMERIC,
  passed BOOLEAN DEFAULT false,
  show_answers BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view own test attempts" ON public.test_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own attempts
CREATE POLICY "Users can create own test attempts" ON public.test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 10: Book Translations
-- ============================================

CREATE TABLE IF NOT EXISTS public.broker_education_books_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.broker_education_books(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  learning_objective TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id, language_code)
);

-- Enable RLS
ALTER TABLE public.broker_education_books_translations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view book translations" ON public.broker_education_books_translations
  FOR SELECT USING (true);

-- ============================================
-- PART 11: Add unlock_requirements to books
-- ============================================

ALTER TABLE public.broker_education_books 
ADD COLUMN IF NOT EXISTS unlock_requirements JSONB DEFAULT '{}';

-- Update restricted books with unlock requirements
UPDATE public.broker_education_books 
SET unlock_requirements = '{"requires_books": [1,2,3,4], "requires_first_deal": true, "requires_tests_passed": true}'
WHERE is_restricted = true;

-- ============================================
-- PART 12: Enhance points_ledger
-- ============================================

ALTER TABLE public.points_ledger 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS user_mode TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS running_total INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- PART 13: Add preferred_books_language to user_preferences
-- ============================================

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS preferred_books_language TEXT DEFAULT 'en';