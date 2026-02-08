-- ===================================================================
-- FIX: customer_reviews RLS policies - Use role-based auth (not hardcoded email)
-- Also extend best_idea_submissions with necessary columns for the form + approval workflow
-- ===================================================================

-- 1) First, drop existing policies on customer_reviews that use hardcoded email
DROP POLICY IF EXISTS "Owner can read all reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Owner can update reviews" ON public.customer_reviews;

-- 2) Create new policies using has_role function (owner role check)
-- Owner can read all reviews
CREATE POLICY "Owner can read all reviews"
ON public.customer_reviews
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
);

-- Owner can update all reviews (approve/reject)
CREATE POLICY "Owner can update reviews"
ON public.customer_reviews
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
);

-- 3) Make sure users can still insert their own reviews
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.customer_reviews;
CREATE POLICY "Users can insert reviews"
ON public.customer_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- 4) Make sure users can read their own reviews
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.customer_reviews;
CREATE POLICY "Users can view their own reviews"
ON public.customer_reviews
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- 5) Allow public visitors to read approved reviews only (for testimonials page)
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.customer_reviews;
CREATE POLICY "Public can view approved reviews"
ON public.customer_reviews
FOR SELECT
USING (
  status = 'approved'
);

-- ===================================================================
-- FIX: best_idea_submissions - Add columns for form fields + approval workflow
-- ===================================================================

-- Add new columns if they don't exist
ALTER TABLE public.best_idea_submissions
  ADD COLUMN IF NOT EXISTS idea_title TEXT,
  ADD COLUMN IF NOT EXISTS idea_category TEXT,
  ADD COLUMN IF NOT EXISTS expected_benefit TEXT,
  ADD COLUMN IF NOT EXISTS enter_draw BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_awarded_at TIMESTAMPTZ;

-- Fix RLS for best_idea_submissions as well
DROP POLICY IF EXISTS "Owner can read all ideas" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Owner can update ideas" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Anyone can submit ideas" ON public.best_idea_submissions;

-- Owner can read all ideas
CREATE POLICY "Owner can read all ideas"
ON public.best_idea_submissions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
);

-- Owner can update ideas (approve/reject)
CREATE POLICY "Owner can update ideas"
ON public.best_idea_submissions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
);

-- Users can submit ideas (with or without auth)
CREATE POLICY "Anyone can submit ideas"
ON public.best_idea_submissions
FOR INSERT
WITH CHECK (true);

-- Users can view their own ideas
DROP POLICY IF EXISTS "Users can view their own ideas" ON public.best_idea_submissions;
CREATE POLICY "Users can view their own ideas"
ON public.best_idea_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);