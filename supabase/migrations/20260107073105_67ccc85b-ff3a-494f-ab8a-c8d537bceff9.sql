-- Fix the permissive RLS policy on security_access_logs
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_access_logs;
CREATE POLICY "Authenticated users can insert own security logs" ON public.security_access_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);