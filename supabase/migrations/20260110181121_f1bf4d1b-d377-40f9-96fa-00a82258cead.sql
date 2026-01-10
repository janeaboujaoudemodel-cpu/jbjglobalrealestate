-- Fix overly permissive INSERT policies on jbj_analytics and jbj_issue_reports

-- Drop the overly permissive policy on jbj_analytics
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.jbj_analytics;

-- Create a proper INSERT policy that requires authentication and validates user_id
CREATE POLICY "Authenticated users can insert their own analytics"
ON public.jbj_analytics
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
  AND tool_name IS NOT NULL 
  AND tool_name <> ''
);

-- Drop the overly permissive policy on jbj_issue_reports
DROP POLICY IF EXISTS "Users can insert issue reports" ON public.jbj_issue_reports;

-- Create a proper INSERT policy that requires authentication and validates user_id
CREATE POLICY "Authenticated users can insert issue reports"
ON public.jbj_issue_reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
  AND tool_name IS NOT NULL 
  AND tool_name <> ''
  AND issue_description IS NOT NULL 
  AND issue_description <> ''
);