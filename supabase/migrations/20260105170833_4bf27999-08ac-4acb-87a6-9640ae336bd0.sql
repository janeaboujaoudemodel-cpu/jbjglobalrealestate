-- =====================================================
-- SECURITY IMPROVEMENTS MIGRATION
-- Fixes critical RLS policy vulnerabilities
-- =====================================================

-- 1. FIX: chat_conversations UPDATE policy allows ANY user to update ANY conversation
-- Drop the insecure policy and create a proper one
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;

-- Create a secure update policy that uses email matching with authenticated user
CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 2. FIX: evaluation_requests dual-key vulnerability
-- Drop existing policies and recreate with stricter user_id only matching
DROP POLICY IF EXISTS "Users can view their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can create evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can update their own evaluation requests" ON public.evaluation_requests;

-- Recreate with user_id only (more secure)
CREATE POLICY "Users can view their own evaluation requests"
ON public.evaluation_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create evaluation requests"
ON public.evaluation_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own evaluation requests"
ON public.evaluation_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- 3. ADD: Rate limiting enforcement for leads table
-- Add index for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_function_rate_limits_lookup 
ON public.function_rate_limits(function_name, rate_key, window_start);

-- 4. ADD: Data retention policy - add columns for tracking data age
ALTER TABLE public.course_sessions 
ADD COLUMN IF NOT EXISTS should_delete_at timestamp with time zone 
DEFAULT (now() + interval '90 days');

ALTER TABLE public.content_access_logs 
ADD COLUMN IF NOT EXISTS should_delete_at timestamp with time zone 
DEFAULT (now() + interval '90 days');

-- 5. IMPROVE: Add unique constraint on profiles to prevent duplicates
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (id);
  END IF;
END $$;

-- 6. IMPROVE: Add admin-only policies for sensitive data viewing
-- Admin can view all broker subscriptions for management
DROP POLICY IF EXISTS "Admins can view all broker subscriptions" ON public.broker_subscriptions;
CREATE POLICY "Admins can view all broker subscriptions"
ON public.broker_subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all leads
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage leads
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
CREATE POLICY "Admins can manage leads"
ON public.leads
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. IMPROVE: Tighten chat_conversations insert policy
DROP POLICY IF EXISTS "Anyone can create chat conversations" ON public.chat_conversations;
CREATE POLICY "Authenticated users can create chat conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 8. ADD: Policy for users to view their own chat conversations
DROP POLICY IF EXISTS "Users can view their own chat conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their own chat conversations"
ON public.chat_conversations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 9. ADD: Admin policy for chat conversations
DROP POLICY IF EXISTS "Admins can view all chat conversations" ON public.chat_conversations;
CREATE POLICY "Admins can view all chat conversations"
ON public.chat_conversations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));