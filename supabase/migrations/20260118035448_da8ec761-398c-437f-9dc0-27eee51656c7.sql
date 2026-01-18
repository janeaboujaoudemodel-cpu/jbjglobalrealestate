-- Fix overly permissive RLS policies for employee_reports table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.employee_reports;
DROP POLICY IF EXISTS "Authenticated users can update reports" ON public.employee_reports;

-- Create properly scoped policies for employee_reports
-- Users can only insert reports where they are the reporter
CREATE POLICY "Users can insert own reports" 
ON public.employee_reports 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = reporter_id);

-- Users can only update reports where they are the reporter  
CREATE POLICY "Users can update own reports" 
ON public.employee_reports 
FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = reporter_id)
WITH CHECK (auth.uid()::text = reporter_id);

-- Fix overly permissive RLS policies for user_uploads table
DROP POLICY IF EXISTS "Authenticated users can upload" ON public.user_uploads;

-- Users can only insert their own uploads (by user_id or session for anonymous)
CREATE POLICY "Users can insert own uploads" 
ON public.user_uploads 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);