GRANT SELECT, INSERT, UPDATE ON public.visitor_sessions TO anon, authenticated;
GRANT ALL ON public.visitor_sessions TO service_role;

DROP POLICY IF EXISTS "allow_visitor_session_insert" ON public.visitor_sessions;
DROP POLICY IF EXISTS "visitor_sessions_rate_limited_insert" ON public.visitor_sessions;
DROP POLICY IF EXISTS "visitor_sessions_update_v2" ON public.visitor_sessions;
DROP POLICY IF EXISTS "allow_visitor_session_update" ON public.visitor_sessions;
DROP POLICY IF EXISTS "visitor_sessions_anon_update" ON public.visitor_sessions;

CREATE POLICY "visitor_sessions_public_insert"
ON public.visitor_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "visitor_sessions_public_update"
ON public.visitor_sessions
FOR UPDATE
TO anon, authenticated
USING (user_id IS NULL OR user_id = auth.uid())
WITH CHECK (user_id IS NULL OR user_id = auth.uid());