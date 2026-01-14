-- Fix PUBLIC_DATA_EXPOSURE: AI logs and summaries have overly permissive RLS policies
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow viewing AI communication logs" ON ai_communication_logs;
DROP POLICY IF EXISTS "Allow inserting AI communication logs" ON ai_communication_logs;
DROP POLICY IF EXISTS "Allow viewing AI daily summaries" ON ai_daily_summaries;
DROP POLICY IF EXISTS "Allow managing AI daily summaries" ON ai_daily_summaries;

-- Create secure admin-only policies for ai_communication_logs
CREATE POLICY "Admins can view AI communication logs" ON ai_communication_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Service role inserts AI communication logs" ON ai_communication_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

-- Create secure admin-only policies for ai_daily_summaries
CREATE POLICY "Admins can view AI daily summaries" ON ai_daily_summaries
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins can manage AI daily summaries" ON ai_daily_summaries
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );