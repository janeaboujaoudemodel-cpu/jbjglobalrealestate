-- Create user journey tracking table for full analytics
CREATE TABLE public.user_journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'click', 'scroll', 'property_view', 'search', 'favorite', 'inquiry', 'tool_use', 'exit'
  page_path TEXT NOT NULL,
  event_data JSONB DEFAULT '{}', -- stores property_id, community, scroll_depth, time_spent, etc.
  referrer TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert own events"
ON public.user_journey_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all events
CREATE POLICY "Admins can view all events"
ON public.user_journey_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also allow anonymous event tracking (guest users)
CREATE POLICY "Anyone can insert anonymous events"
ON public.user_journey_events FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Create phone verification table
CREATE TABLE public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view/create their own verifications
CREATE POLICY "Users can manage own phone verifications"
ON public.phone_verifications FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add phone verification fields to profiles if not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_role TEXT; -- 'broker', 'investor', 'visitor'

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_journey_events_user ON public.user_journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_session ON public.user_journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_created ON public.user_journey_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user ON public.phone_verifications(user_id);