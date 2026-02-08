-- =====================================================
-- Phase 1: Fix RLS policies for customer_reviews and best_idea_submissions
-- Remove duplicates, use proper Owner verification via has_role function
-- =====================================================

-- First, drop ALL existing duplicate/problematic policies on customer_reviews
DROP POLICY IF EXISTS "Owner can delete any review" ON public.customer_reviews;
DROP POLICY IF EXISTS "Owner can read all reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Owner can update any review" ON public.customer_reviews;
DROP POLICY IF EXISTS "Owner can update reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Owner can view all reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Public can view published reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Users can insert reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Users can update own reviews within 30 days" ON public.customer_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.customer_reviews;

-- Create clean, proper RLS policies for customer_reviews
-- 1. Anyone can view published/approved reviews
CREATE POLICY "Public can view approved reviews"
ON public.customer_reviews FOR SELECT
USING (status = 'approved' OR status = 'published');

-- 2. Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
ON public.customer_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Users can view their own reviews
CREATE POLICY "Users can view own reviews"
ON public.customer_reviews FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 4. Users can update own reviews within 30 days
CREATE POLICY "Users can update own reviews within 30 days"
ON public.customer_reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND created_at > now() - interval '30 days')
WITH CHECK (user_id = auth.uid());

-- 5. Owner can read all reviews (using has_role function)
CREATE POLICY "Owner can read all reviews"
ON public.customer_reviews FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- 6. Owner can update all reviews
CREATE POLICY "Owner can update all reviews"
ON public.customer_reviews FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 7. Owner can delete reviews
CREATE POLICY "Owner can delete reviews"
ON public.customer_reviews FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- =====================================================
-- Now fix best_idea_submissions policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can read best idea submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Anyone can create idea submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Anyone can submit ideas" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Owner can read all ideas" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Owner can update idea submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Owner can update ideas" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Owner can view all idea submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Rate limited idea submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Users can view own idea submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Users can view their own ideas" ON public.best_idea_submissions;

-- Clean policies for best_idea_submissions
-- 1. Anyone can submit ideas (public form)
CREATE POLICY "Anyone can submit ideas"
ON public.best_idea_submissions FOR INSERT
WITH CHECK (true);

-- 2. Authenticated users can view their own submissions
CREATE POLICY "Users can view own ideas"
ON public.best_idea_submissions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. Owner can read all submissions
CREATE POLICY "Owner can read all ideas"
ON public.best_idea_submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- 4. Owner can update submissions (approve/reject)
CREATE POLICY "Owner can update ideas"
ON public.best_idea_submissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 5. Owner can delete submissions
CREATE POLICY "Owner can delete ideas"
ON public.best_idea_submissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- =====================================================
-- Add email tracking columns to support_ticket_messages
-- =====================================================
ALTER TABLE public.support_ticket_messages
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ;

-- Update the send-ticket-reply-email function sender name will be done in edge function