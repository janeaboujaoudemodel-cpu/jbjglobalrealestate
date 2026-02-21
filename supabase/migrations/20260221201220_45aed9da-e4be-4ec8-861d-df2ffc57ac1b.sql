
-- ============================================================
-- Phase 1: Newsletter System Schema Enhancement
-- ============================================================

-- 1A. Enhance newsletter_subscribers with missing columns
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS consent_version text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS gdpr_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS preference_tags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resend_message_id text,
  ADD COLUMN IF NOT EXISTS unsubscribe_source text,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid DEFAULT gen_random_uuid();

-- Ensure unsubscribe_token is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsubscribe_token 
  ON public.newsletter_subscribers(unsubscribe_token);

-- Index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_user_id 
  ON public.newsletter_subscribers(user_id) WHERE user_id IS NOT NULL;

-- 1B. Create newsletter_events table
CREATE TABLE IF NOT EXISTS public.newsletter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('subscribe', 'unsubscribe', 'resubscribe', 'toggle_off', 'toggle_on', 'preference_update')),
  source text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own newsletter events"
  ON public.newsletter_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage newsletter events"
  ON public.newsletter_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_newsletter_events_email ON public.newsletter_events(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_events_created_at ON public.newsletter_events(created_at DESC);

-- 1C. Create user_profile_summaries table
CREATE TABLE IF NOT EXISTS public.user_profile_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  user_id uuid,
  full_name text,
  phone text,
  subscribed boolean DEFAULT false,
  subscribed_at timestamptz,
  last_active_at timestamptz,
  device_type text,
  sessions_count integer DEFAULT 0,
  avg_time_on_site integer DEFAULT 0,
  top_areas text,
  top_projects text,
  avg_budget_estimate text,
  preferred_bedrooms text,
  preferred_property_type text,
  viewed_count integer DEFAULT 0,
  saved_count integer DEFAULT 0,
  inquiries_count integer DEFAULT 0,
  tools_used text,
  intent_score text DEFAULT 'low',
  engagement_score integer DEFAULT 0,
  segment_tag text,
  recommended_campaign_tag text,
  ai_summary text,
  preference_tags jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_profile_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile summary"
  ON public.user_profile_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all profile summaries"
  ON public.user_profile_summaries FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Owner can read all profile summaries"
  ON public.user_profile_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_role = 'owner'
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_profile_summaries_segment ON public.user_profile_summaries(segment_tag);
CREATE INDEX IF NOT EXISTS idx_user_profile_summaries_intent ON public.user_profile_summaries(intent_score);
CREATE INDEX IF NOT EXISTS idx_user_profile_summaries_engagement ON public.user_profile_summaries(engagement_score);
