-- Create user_visitor_role enum for visitor type selection
CREATE TYPE public.visitor_role AS ENUM ('broker', 'referral_partner', 'client', 'visitor');

-- Create user_role_selections table to track user's selected role
CREATE TABLE public.user_role_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guests without accounts
  selected_role visitor_role NOT NULL,
  confirmed_accurate BOOLEAN DEFAULT false NOT NULL,
  email TEXT,
  full_name TEXT,
  phone_e164 TEXT,
  nationality TEXT,
  current_location_city TEXT,
  current_location_country TEXT,
  preferred_language TEXT DEFAULT 'en',
  date_of_birth DATE,
  age_range TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.user_role_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own role selection"
ON public.user_role_selections FOR SELECT
USING (auth.uid() = user_id OR session_id = current_setting('request.headers', true)::json->>'x-session-id');

CREATE POLICY "Users can insert own role selection"
ON public.user_role_selections FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own role selection"
ON public.user_role_selections FOR UPDATE
USING (auth.uid() = user_id OR session_id = current_setting('request.headers', true)::json->>'x-session-id');

-- Create UAE developers table with sales rep management
CREATE TABLE public.uae_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  headquarters TEXT,
  location_city TEXT DEFAULT 'Dubai',
  location_emirate TEXT DEFAULT 'Dubai',
  description TEXT,
  website_url TEXT,
  founded_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create developer sales representatives table
CREATE TABLE public.developer_sales_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES public.uae_developers(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT DEFAULT 'Sales Representative',
  phone_e164 TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.uae_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_sales_reps ENABLE ROW LEVEL SECURITY;

-- Public read access for developers
CREATE POLICY "Anyone can view active developers"
ON public.uae_developers FOR SELECT
USING (is_active = true);

-- Admin can manage developers
CREATE POLICY "Admins can manage developers"
ON public.uae_developers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public read access for sales reps
CREATE POLICY "Anyone can view active sales reps"
ON public.developer_sales_reps FOR SELECT
USING (is_active = true);

-- Admin can manage sales reps
CREATE POLICY "Admins can manage sales reps"
ON public.developer_sales_reps FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create broker onboarding progress table
CREATE TABLE public.broker_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role_confirmed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  hr_intro_completed BOOLEAN DEFAULT false,
  company_training_completed BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 1,
  points_earned INTEGER DEFAULT 0,
  rewards_claimed TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.broker_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
ON public.broker_onboarding_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.broker_onboarding_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.broker_onboarding_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Insert some initial UAE developers
INSERT INTO public.uae_developers (name, slug, location_city, location_emirate, description) VALUES
('Emaar Properties', 'emaar', 'Dubai', 'Dubai', 'Leading UAE developer behind Burj Khalifa and Dubai Mall'),
('Nakheel', 'nakheel', 'Dubai', 'Dubai', 'Developer of Palm Jumeirah and The World Islands'),
('DAMAC Properties', 'damac', 'Dubai', 'Dubai', 'Luxury real estate developer'),
('Sobha Realty', 'sobha', 'Dubai', 'Dubai', 'Premium residential developer'),
('Meraas', 'meraas', 'Dubai', 'Dubai', 'Innovative urban developer'),
('Aldar Properties', 'aldar', 'Abu Dhabi', 'Abu Dhabi', 'Leading Abu Dhabi developer'),
('Dubai Properties', 'dubai-properties', 'Dubai', 'Dubai', 'Major residential developer'),
('DEYAAR', 'deyaar', 'Dubai', 'Dubai', 'Diversified real estate developer'),
('Azizi Developments', 'azizi', 'Dubai', 'Dubai', 'Fast-growing developer'),
('Danube Properties', 'danube', 'Dubai', 'Dubai', 'Affordable luxury developer'),
('Ellington Properties', 'ellington', 'Dubai', 'Dubai', 'Design-led developer'),
('Imtiaz Developments', 'imtiaz', 'Dubai', 'Dubai', 'Quality residential developer'),
('MAG Property Development', 'mag', 'Dubai', 'Dubai', 'Diverse portfolio developer'),
('Binghatti Developers', 'binghatti', 'Dubai', 'Dubai', 'Modern architecture developer'),
('Select Group', 'select-group', 'Dubai', 'Dubai', 'Premium waterfront developer');