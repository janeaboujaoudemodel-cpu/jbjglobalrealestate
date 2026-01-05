-- Fix evaluation_requests RLS - remove email-based access loophole
-- Drop existing policies that allow email matching
DROP POLICY IF EXISTS "Users can view their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Anyone can view evaluation requests" ON public.evaluation_requests;

-- Create strict policy that only allows user_id matching (no email matching)
CREATE POLICY "Users can view their own evaluation requests by user_id only"
ON public.evaluation_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure admins can still see all for analytics
CREATE POLICY "Admins can view all evaluation requests"
ON public.evaluation_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));