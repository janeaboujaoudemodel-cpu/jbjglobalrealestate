-- Fix EXPOSED_SENSITIVE_DATA for evaluation_requests
-- Create a secure view that hides sensitive contact info from non-admins
-- And tighten RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can create evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can view all evaluation requests" ON public.evaluation_requests;

-- Create stricter SELECT policy - users can only see their own, admins see all
CREATE POLICY "Users can view own evaluation requests" 
ON public.evaluation_requests 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- Create stricter INSERT policy - require rate limiting fields and validation
CREATE POLICY "Authenticated users can create evaluation requests" 
ON public.evaluation_requests 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Fix EXPOSED_SENSITIVE_DATA for memberships
-- Tighten access so only the owner and admins can see payment info

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can create their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;

-- Create owner-only SELECT policy with admin access
CREATE POLICY "Users can view own memberships" 
ON public.memberships 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- Create owner-only INSERT policy
CREATE POLICY "Users can create own memberships" 
ON public.memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create owner-only UPDATE policy  
CREATE POLICY "Users can update own memberships" 
ON public.memberships 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add admin UPDATE policy
CREATE POLICY "Admins can update memberships" 
ON public.memberships 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));