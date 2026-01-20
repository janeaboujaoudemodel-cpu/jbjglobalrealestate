-- Fix evaluation_requests RLS: Remove public SELECT policies that expose PII
-- This table contains emails, names, and phone numbers that must be protected

-- Drop the problematic policies that allow public role access
DROP POLICY IF EXISTS "Staff can read evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_admin_select" ON public.evaluation_requests;

-- Also drop duplicate/redundant policies to clean up
DROP POLICY IF EXISTS "Admins can view evaluations" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_admin_select" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_select_admin_only" ON public.evaluation_requests;

-- Create a single, consolidated SELECT policy for authenticated authorized staff only
CREATE POLICY "Authorized staff can read evaluation requests"
ON public.evaluation_requests
FOR SELECT
TO authenticated
USING (
  -- Admins and owners have full access
  public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  -- CRM admins have access
  OR public.is_crm_admin(auth.uid())
  -- Users can see their own submissions
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);