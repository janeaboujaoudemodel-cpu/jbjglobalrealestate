-- ============================================================
-- PHASE 1: JBJ BROKER HUB DATABASE SCHEMA
-- Complete backend infrastructure for broker/client management
-- ============================================================

-- ============================================================
-- SECTION C1: EXTEND ENUMS FOR NEW ROLES AND TYPES
-- ============================================================

-- Add new values to app_role enum if they don't exist
DO $$ 
BEGIN
  -- Add broker_jbj (internal JBJ broker)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'broker_jbj' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'broker_jbj';
  END IF;
  
  -- Add broker_partner (external partner broker)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'broker_partner' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'broker_partner';
  END IF;
  
  -- Add client role
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'client';
  END IF;
  
  -- Add support_ops role
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'support_ops' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'support_ops';
  END IF;
END $$;

-- Create user_mode enum for client/broker mode
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_mode') THEN
    CREATE TYPE public.user_mode AS ENUM ('client', 'broker');
  END IF;
END $$;

-- Create tier enum for broker progression
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_tier') THEN
    CREATE TYPE public.broker_tier AS ENUM ('starter', 'rising', 'performer', 'elite', 'legend');
  END IF;
END $$;

-- Create client tier enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_tier') THEN
    CREATE TYPE public.client_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
  END IF;
END $$;

-- Create points event type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'points_event_type') THEN
    CREATE TYPE public.points_event_type AS ENUM (
      'training_complete', 
      'daily_checkin', 
      'developer_visit_checkin', 
      'deal_closed', 
      'referral_bonus', 
      'admin_adjustment', 
      'reward_redeem',
      'module_complete',
      'login_streak',
      'first_deal_bonus'
    );
  END IF;
END $$;

-- Create deal status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_status') THEN
    CREATE TYPE public.deal_status AS ENUM ('submitted', 'pending_verification', 'verified', 'rejected', 'cancelled');
  END IF;
END $$;

-- Create visit request status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visit_request_status') THEN
    CREATE TYPE public.visit_request_status AS ENUM ('submitted', 'approved', 'rejected', 'completed', 'cancelled');
  END IF;
END $$;

-- Create visit purpose enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visit_purpose') THEN
    CREATE TYPE public.visit_purpose AS ENUM ('briefing', 'general_visit', 'client_tour', 'deal_closing');
  END IF;
END $$;

-- Create checkin type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkin_type') THEN
    CREATE TYPE public.checkin_type AS ENUM ('gps_selfie', 'manual_register', 'qr_scan');
  END IF;
END $$;

-- Create reward redemption status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'redemption_status') THEN
    CREATE TYPE public.redemption_status AS ENUM ('requested', 'approved', 'delivered', 'rejected');
  END IF;
END $$;

-- Create book access level enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'book_access_level') THEN
    CREATE TYPE public.book_access_level AS ENUM ('broker_only', 'broker_jbj_only', 'locked_until_first_deal', 'public');
  END IF;
END $$;

-- Create notification type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM ('system', 'event', 'approval', 'reminder', 'reward', 'deal', 'visit');
  END IF;
END $$;

-- Create card status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_status') THEN
    CREATE TYPE public.card_status AS ENUM ('active', 'suspended', 'expired');
  END IF;
END $$;

-- ============================================================
-- SECTION C1: USERS PROFILE EXTENSION
-- ============================================================

-- Add columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add first_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE public.profiles ADD COLUMN first_name text;
  END IF;
  
  -- Add last_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN last_name text;
  END IF;
  
  -- Add avatar_initials
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_initials') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_initials text;
  END IF;
  
  -- Add user_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
    ALTER TABLE public.profiles ADD COLUMN user_type text DEFAULT 'client';
  END IF;
  
  -- Add mode_default
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mode_default') THEN
    ALTER TABLE public.profiles ADD COLUMN mode_default text DEFAULT 'client';
  END IF;
  
  -- Add broker_tier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'broker_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN broker_tier text DEFAULT 'starter';
  END IF;
  
  -- Add client_tier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'client_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN client_tier text DEFAULT 'bronze';
  END IF;
  
  -- Add tier_updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tier_updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN tier_updated_at timestamptz;
  END IF;
  
  -- Add last_login_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at timestamptz;
  END IF;
  
  -- Add login_streak
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'login_streak') THEN
    ALTER TABLE public.profiles ADD COLUMN login_streak integer DEFAULT 0;
  END IF;
  
  -- Add total_login_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_login_days') THEN
    ALTER TABLE public.profiles ADD COLUMN total_login_days integer DEFAULT 0;
  END IF;
  
  -- Add first_deal_verified
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_deal_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN first_deal_verified boolean DEFAULT false;
  END IF;
  
  -- Add first_deal_verified_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_deal_verified_at') THEN
    ALTER TABLE public.profiles ADD COLUMN first_deal_verified_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- SECTION C2: USER PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  selected_mode text DEFAULT 'client',
  marketing_opt_in boolean DEFAULT false,
  preferred_language text DEFAULT 'en',
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read/write their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SECTION C3: POINTS LEDGER (AUDITABLE)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_ref_id uuid,
  event_description text,
  points_delta integer NOT NULL,
  points_balance_after integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_event_type ON public.points_ledger(event_type);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created_at ON public.points_ledger(created_at DESC);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read their own points history
DROP POLICY IF EXISTS "Users can view own points" ON public.points_ledger;
CREATE POLICY "Users can view own points" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all and insert adjustments
DROP POLICY IF EXISTS "Admins can manage all points" ON public.points_ledger;
CREATE POLICY "Admins can manage all points" ON public.points_ledger
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SECTION C3: REWARDS REDEMPTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rewards_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES public.rewards_catalog(id) ON DELETE SET NULL,
  points_spent integer NOT NULL,
  status text DEFAULT 'requested',
  requested_at timestamptz DEFAULT now() NOT NULL,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rewards_redemptions_user ON public.rewards_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_redemptions_status ON public.rewards_redemptions(status);

ALTER TABLE public.rewards_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own redemptions" ON public.rewards_redemptions;
CREATE POLICY "Users can view own redemptions" ON public.rewards_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can request redemptions" ON public.rewards_redemptions;
CREATE POLICY "Users can request redemptions" ON public.rewards_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage redemptions" ON public.rewards_redemptions;
CREATE POLICY "Admins can manage redemptions" ON public.rewards_redemptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SECTION C4: BOOKS CATALOG (3D PREVIEW ONLY)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.books_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  synopsis text,
  chapters_json jsonb DEFAULT '[]'::jsonb,
  pages_count integer DEFAULT 0,
  cover_asset_url text,
  access_level text DEFAULT 'broker_only',
  is_downloadable boolean DEFAULT false,
  is_readable boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.books_catalog ENABLE ROW LEVEL SECURITY;

-- Books are viewable by authenticated users (access checked in app logic)
DROP POLICY IF EXISTS "Authenticated users can view books" ON public.books_catalog;
CREATE POLICY "Authenticated users can view books" ON public.books_catalog
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage books" ON public.books_catalog;
CREATE POLICY "Admins can manage books" ON public.books_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SECTION C5: DEALS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  unit_number text NOT NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  deal_value_aed numeric NOT NULL,
  developer_id uuid REFERENCES public.developers(id) ON DELETE SET NULL,
  developer_name text,
  deal_status text DEFAULT 'submitted',
  submitted_at timestamptz DEFAULT now() NOT NULL,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  rejected_reason text,
  points_awarded integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deals_broker ON public.deals(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(deal_status);
CREATE INDEX IF NOT EXISTS idx_deals_developer ON public.deals(developer_id);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Brokers can view and create their own deals
DROP POLICY IF EXISTS "Brokers can view own deals" ON public.deals;
CREATE POLICY "Brokers can view own deals" ON public.deals
  FOR SELECT TO authenticated
  USING (auth.uid() = broker_user_id);

DROP POLICY IF EXISTS "Brokers can create deals" ON public.deals;
CREATE POLICY "Brokers can create deals" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = broker_user_id);

-- Admins can manage all deals
DROP POLICY IF EXISTS "Admins can manage all deals" ON public.deals;
CREATE POLICY "Admins can manage all deals" ON public.deals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SECTION C5: REFERRALS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_type text DEFAULT 'broker_referral',
  referral_code text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(referrer_user_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_user_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
CREATE POLICY "Admins can manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SECTION C6: DEVELOPER VISIT REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.developer_visit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  developer_id uuid REFERENCES public.developers(id) ON DELETE CASCADE NOT NULL,
  requested_date date NOT NULL,
  requested_time time,
  purpose text DEFAULT 'general_visit',
  status text DEFAULT 'submitted',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  contact_revealed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visit_requests_user ON public.developer_visit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_developer ON public.developer_visit_requests(developer_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_status ON public.developer_visit_requests(status);

ALTER TABLE public.developer_visit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own visit requests" ON public.developer_visit_requests;
CREATE POLICY "Users can view own visit requests" ON public.developer_visit_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create visit requests" ON public.developer_visit_requests;
CREATE POLICY "Users can create visit requests" ON public.developer_visit_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage visit requests" ON public.developer_visit_requests;
CREATE POLICY "Admins can manage visit requests" ON public.developer_visit_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SECTION C6: ADD COLUMNS TO DEVELOPER VISIT CHECKINS
-- ============================================================

DO $$ 
BEGIN
  -- Add checkin_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developer_visit_checkins' AND column_name = 'checkin_type') THEN
    ALTER TABLE public.developer_visit_checkins ADD COLUMN checkin_type text DEFAULT 'gps_selfie';
  END IF;
  
  -- Add location_accuracy_m
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developer_visit_checkins' AND column_name = 'location_accuracy_m') THEN
    ALTER TABLE public.developer_visit_checkins ADD COLUMN location_accuracy_m numeric;
  END IF;
  
  -- Add selfie_url (alias for check_in_photo_url)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developer_visit_checkins' AND column_name = 'selfie_url') THEN
    ALTER TABLE public.developer_visit_checkins ADD COLUMN selfie_url text;
  END IF;
  
  -- Add feedback_json
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developer_visit_checkins' AND column_name = 'feedback_json') THEN
    ALTER TABLE public.developer_visit_checkins ADD COLUMN feedback_json jsonb;
  END IF;
  
  -- Add points_awarded
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developer_visit_checkins' AND column_name = 'points_awarded') THEN
    ALTER TABLE public.developer_visit_checkins ADD COLUMN points_awarded integer DEFAULT 0;
  END IF;
  
  -- Add visit_request_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developer_visit_checkins' AND column_name = 'visit_request_id') THEN
    ALTER TABLE public.developer_visit_checkins ADD COLUMN visit_request_id uuid REFERENCES public.developer_visit_requests(id);
  END IF;
END $$;

-- ============================================================
-- SECTION C7: MEMBERSHIP CARDS (DIGITAL ID)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  card_number text UNIQUE NOT NULL,
  qr_payload text UNIQUE NOT NULL,
  card_status text DEFAULT 'active',
  card_type text DEFAULT 'standard',
  issued_at timestamptz DEFAULT now() NOT NULL,
  issued_by uuid REFERENCES auth.users(id),
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_membership_cards_user ON public.membership_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_cards_number ON public.membership_cards(card_number);

ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own card" ON public.membership_cards;
CREATE POLICY "Users can view own card" ON public.membership_cards
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage cards" ON public.membership_cards;
CREATE POLICY "Admins can manage cards" ON public.membership_cards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SECTION C8: NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text,
  notification_type text DEFAULT 'system',
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- ============================================================
-- SECTION C9: EXTEND AUDIT LOGS
-- ============================================================

-- Add columns to audit_logs if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_type') THEN
    ALTER TABLE public.audit_logs ADD COLUMN entity_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_id') THEN
    ALTER TABLE public.audit_logs ADD COLUMN entity_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'metadata') THEN
    ALTER TABLE public.audit_logs ADD COLUMN metadata jsonb;
  END IF;
END $$;

-- ============================================================
-- SECTION D4: HELPER FUNCTIONS FOR ACCESS CONTROL
-- ============================================================

-- Function to check if user has verified first deal (for partner broker unlock)
CREATE OR REPLACE FUNCTION public.has_verified_first_deal(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals
    WHERE broker_user_id = _user_id
    AND deal_status = 'verified'
    LIMIT 1
  );
$$;

-- Function to get user's current points balance
CREATE OR REPLACE FUNCTION public.get_user_points_balance(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT points_balance_after 
     FROM public.points_ledger 
     WHERE user_id = _user_id 
     ORDER BY created_at DESC 
     LIMIT 1),
    0
  );
$$;

-- Function to get user's tier
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id uuid, _mode text DEFAULT 'broker')
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _mode = 'broker' THEN COALESCE(broker_tier, 'starter')
      ELSE COALESCE(client_tier, 'bronze')
    END
  FROM public.profiles
  WHERE id = _user_id;
$$;

-- Function to add points entry
CREATE OR REPLACE FUNCTION public.add_points(
  _user_id uuid,
  _event_type text,
  _points_delta integer,
  _event_ref_id uuid DEFAULT NULL,
  _event_description text DEFAULT NULL,
  _created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance integer;
  _new_id uuid;
BEGIN
  -- Get current balance
  SELECT COALESCE(
    (SELECT points_balance_after FROM public.points_ledger WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 1),
    0
  ) INTO _current_balance;
  
  -- Insert new entry
  INSERT INTO public.points_ledger (
    user_id, event_type, event_ref_id, event_description, 
    points_delta, points_balance_after, created_by
  ) VALUES (
    _user_id, _event_type, _event_ref_id, _event_description,
    _points_delta, _current_balance + _points_delta, COALESCE(_created_by, _user_id)
  ) RETURNING id INTO _new_id;
  
  RETURN _new_id;
END;
$$;

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  _card_number text;
  _exists boolean;
BEGIN
  LOOP
    -- Generate format: JBJ-XXXX-XXXX-XXXX
    _card_number := 'JBJ-' || 
      LPAD(floor(random() * 10000)::text, 4, '0') || '-' ||
      LPAD(floor(random() * 10000)::text, 4, '0') || '-' ||
      LPAD(floor(random() * 10000)::text, 4, '0');
    
    SELECT EXISTS (
      SELECT 1 FROM public.membership_cards WHERE card_number = _card_number
    ) INTO _exists;
    
    EXIT WHEN NOT _exists;
  END LOOP;
  
  RETURN _card_number;
END;
$$;

-- Trigger to auto-create membership card on profile creation
CREATE OR REPLACE FUNCTION public.create_membership_card_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _card_number text;
BEGIN
  -- Generate unique card number
  _card_number := public.generate_card_number();
  
  -- Create membership card
  INSERT INTO public.membership_cards (user_id, card_number, qr_payload)
  VALUES (NEW.id, _card_number, encode(gen_random_bytes(32), 'hex'))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS create_card_on_profile ON public.profiles;
CREATE TRIGGER create_card_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_membership_card_for_user();

-- ============================================================
-- SECTION: UPDATE TIMESTAMPS TRIGGERS
-- ============================================================

-- Generic updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for new tables
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_visit_requests_updated_at ON public.developer_visit_requests;
CREATE TRIGGER update_visit_requests_updated_at
  BEFORE UPDATE ON public.developer_visit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_catalog_updated_at ON public.books_catalog;
CREATE TRIGGER update_books_catalog_updated_at
  BEFORE UPDATE ON public.books_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_membership_cards_updated_at ON public.membership_cards;
CREATE TRIGGER update_membership_cards_updated_at
  BEFORE UPDATE ON public.membership_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rewards_redemptions_updated_at ON public.rewards_redemptions;
CREATE TRIGGER update_rewards_redemptions_updated_at
  BEFORE UPDATE ON public.rewards_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();