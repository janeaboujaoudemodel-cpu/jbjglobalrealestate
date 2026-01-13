-- Fix permissive RLS policies by adding proper checks

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON public.jbj_activity_logs;
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.jbj_daily_reports;
DROP POLICY IF EXISTS "Anyone can update reports" ON public.jbj_daily_reports;

-- Create proper policies for activity logs
CREATE POLICY "Authenticated users can insert activity logs"
ON public.jbj_activity_logs FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Create proper policies for daily reports
CREATE POLICY "Brokers can insert their reports"
ON public.jbj_daily_reports FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Brokers can update their reports"
ON public.jbj_daily_reports FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);