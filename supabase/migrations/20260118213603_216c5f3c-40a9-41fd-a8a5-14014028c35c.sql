-- Add rate limiting to remaining public INSERT policies

-- chat_conversations: Rate limit public chat creation
DROP POLICY IF EXISTS "chat_conversations_public_insert" ON public.chat_conversations;

CREATE POLICY "chat_conversations_rate_limited_insert"
ON public.chat_conversations FOR INSERT
TO public
WITH CHECK (
  public.check_rate_limit(
    COALESCE(user_email, current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'chat_conversation',
    20,   -- max 20 conversations per email/IP
    60    -- per 60 minutes
  )
);

-- contact_gating_submissions: Rate limit
DROP POLICY IF EXISTS "Anyone can insert contact gating submissions" ON public.contact_gating_submissions;

CREATE POLICY "contact_gating_rate_limited_insert"
ON public.contact_gating_submissions FOR INSERT
TO public
WITH CHECK (
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'contact_gating',
    10,   -- max 10 submissions per IP
    60    -- per 60 minutes
  )
);

-- faq_unanswered_questions: Rate limit
DROP POLICY IF EXISTS "Anyone can submit FAQ questions" ON public.faq_unanswered_questions;

CREATE POLICY "faq_questions_rate_limited_insert"
ON public.faq_unanswered_questions FOR INSERT
TO public
WITH CHECK (
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'faq_question',
    5,    -- max 5 questions per IP
    60    -- per 60 minutes
  )
);

-- hr_applications: Rate limit job applications
DROP POLICY IF EXISTS "hr_applications_public_submit" ON public.hr_applications;

CREATE POLICY "hr_applications_rate_limited_insert"
ON public.hr_applications FOR INSERT
TO public
WITH CHECK (
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'hr_application',
    5,    -- max 5 applications per IP
    1440  -- per 24 hours (1440 minutes)
  )
);

-- user_behavior_tracking: Rate limit analytics
DROP POLICY IF EXISTS "Anyone can insert behavior data" ON public.user_behavior_tracking;

CREATE POLICY "behavior_tracking_rate_limited_insert"
ON public.user_behavior_tracking FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'behavior_tracking',
    1000, -- max 1000 events per IP
    60    -- per 60 minutes
  )
);

-- user_downloads: Rate limit download logging
DROP POLICY IF EXISTS "Anyone can log downloads" ON public.user_downloads;

CREATE POLICY "downloads_rate_limited_insert"
ON public.user_downloads FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'user_download',
    50,   -- max 50 downloads per IP
    60    -- per 60 minutes
  )
);

-- Remove duplicate vapi policy
DROP POLICY IF EXISTS "System can insert call logs" ON public.vapi_call_logs;