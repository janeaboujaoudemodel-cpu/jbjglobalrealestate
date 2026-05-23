-- Allow anonymous visitors to update their own visitor_sessions row (user_id stays NULL).
-- Existing policy only permitted authenticated users (user_id = auth.uid()), which caused
-- 403s during the initial upsert/ON CONFLICT flow for anonymous tracking.
CREATE POLICY "visitor_sessions_anon_update"
ON public.visitor_sessions
FOR UPDATE
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);