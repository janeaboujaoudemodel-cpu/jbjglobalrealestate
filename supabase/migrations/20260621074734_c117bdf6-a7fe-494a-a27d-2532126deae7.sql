DROP POLICY IF EXISTS "visitor_sessions_public_select_for_upsert" ON public.visitor_sessions;

CREATE POLICY "visitor_sessions_public_select_for_upsert"
ON public.visitor_sessions
FOR SELECT
TO anon, authenticated
USING (user_id IS NULL OR user_id = auth.uid());