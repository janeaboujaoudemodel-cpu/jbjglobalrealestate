-- Fix evaluation_requests RLS - remove public access, require authentication
DROP POLICY IF EXISTS "Anyone can create evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Anyone can view evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Authenticated users can create evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can view all evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can update evaluation requests" ON public.evaluation_requests;

-- New secure policies for evaluation_requests
-- Authenticated users can only INSERT their own requests (must be logged in)
CREATE POLICY "Authenticated users can create their own evaluation requests"
ON public.evaluation_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can only view their own evaluation requests
CREATE POLICY "Users can view only their own evaluation requests"
ON public.evaluation_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can update evaluation requests
CREATE POLICY "Only admins can update evaluation requests"
ON public.evaluation_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete evaluation requests
CREATE POLICY "Only admins can delete evaluation requests"
ON public.evaluation_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix leads table RLS - ensure admin-only access for SELECT
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Secure leads policies - service role for INSERT (from edge functions), admin-only for everything else
CREATE POLICY "Service role can insert leads"
ON public.leads
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Only admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));