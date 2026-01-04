-- Fix security: Ensure evaluation_requests table is properly protected
-- Users should only see their own requests, admins can see all

-- First, let's ensure the existing policies are correct by dropping and recreating them
DROP POLICY IF EXISTS "Admins can manage all evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Authenticated users can create evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view own evaluation requests" ON public.evaluation_requests;

-- Admin full access
CREATE POLICY "Admins can manage all evaluation requests" 
ON public.evaluation_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can only create requests linked to their own user_id
CREATE POLICY "Users can create own evaluation requests" 
ON public.evaluation_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only view their own requests
CREATE POLICY "Users can view own evaluation requests" 
ON public.evaluation_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Also add unique constraint on leads email to prevent duplicates
ALTER TABLE public.leads 
ADD CONSTRAINT leads_email_unique UNIQUE (email);