-- ============================================================
-- Fix RLS policies that incorrectly query auth.users table
-- This causes "permission denied for table users" errors
-- Solution: Use auth.jwt() ->> 'email' instead
-- ============================================================

-- Drop and recreate support_tickets policies to use JWT email
DROP POLICY IF EXISTS "support_tickets_secure_select" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;

-- Owner can view all tickets (using has_role which already works)
CREATE POLICY "Owner can view all support tickets"
ON public.support_tickets
FOR SELECT
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Users can view their own tickets by matching email from JWT
CREATE POLICY "Users can view own tickets by email"
ON public.support_tickets
FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')
);

-- Drop and recreate support_ticket_messages policies
DROP POLICY IF EXISTS "Users can read messages for their tickets" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Users can reply to their tickets" ON public.support_ticket_messages;

-- Owner can view all messages
CREATE POLICY "Owner can view all ticket messages"
ON public.support_ticket_messages
FOR SELECT
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Users can view messages for their own tickets (by email match)
CREATE POLICY "Users can view messages for own tickets"
ON public.support_ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id
    AND email = (auth.jwt() ->> 'email')
  )
);

-- Owner can insert messages
CREATE POLICY "Owner can reply to tickets"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Users can reply to their own tickets
CREATE POLICY "Users can reply to own tickets"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id
    AND email = (auth.jwt() ->> 'email')
  )
);

-- ============================================================
-- Fix best_idea_submissions policies that also query auth.users
-- ============================================================
DROP POLICY IF EXISTS "Users can view own submissions" ON public.best_idea_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.best_idea_submissions;

-- Owner can view all submissions
CREATE POLICY "Owner can view all idea submissions"
ON public.best_idea_submissions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Users can view their own submissions by email or user_id
CREATE POLICY "Users can view own idea submissions"
ON public.best_idea_submissions
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (email = (auth.jwt() ->> 'email'))
  OR (actual_email = (auth.jwt() ->> 'email'))
);

-- Anyone can create submissions (no auth required for anonymous)
CREATE POLICY "Anyone can create idea submissions"
ON public.best_idea_submissions
FOR INSERT
WITH CHECK (true);

-- Owner can update submissions
CREATE POLICY "Owner can update idea submissions"
ON public.best_idea_submissions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
);