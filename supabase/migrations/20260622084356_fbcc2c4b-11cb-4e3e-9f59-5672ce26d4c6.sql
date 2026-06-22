
DROP POLICY IF EXISTS "visitor_sessions_public_select_for_upsert" ON public.visitor_sessions;
DROP POLICY IF EXISTS "visitor_sessions_public_update" ON public.visitor_sessions;

REVOKE SELECT, UPDATE ON public.visitor_sessions FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.visitor_sessions TO authenticated;
GRANT ALL ON public.visitor_sessions TO service_role;

DROP POLICY IF EXISTS "visitor_sessions_public_insert" ON public.visitor_sessions;
CREATE POLICY "visitor_sessions_public_insert"
ON public.visitor_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "visitor_sessions_owner_select" ON public.visitor_sessions;
CREATE POLICY "visitor_sessions_owner_select"
ON public.visitor_sessions
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "visitor_sessions_owner_update" ON public.visitor_sessions;
CREATE POLICY "visitor_sessions_owner_update"
ON public.visitor_sessions
FOR UPDATE
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid())
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.track_visitor_session_upsert(
  p_session_id text,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 8 OR length(p_session_id) > 128 THEN
    RAISE EXCEPTION 'invalid session_id';
  END IF;

  INSERT INTO public.visitor_sessions (
    session_id, device_type, browser, os, referrer, landing_page,
    pages_visited, user_id, user_agent, screen_resolution, viewport_size,
    language, network_type
  )
  VALUES (
    p_session_id,
    NULLIF(p_payload->>'device_type',''),
    NULLIF(p_payload->>'browser',''),
    NULLIF(p_payload->>'os',''),
    NULLIF(p_payload->>'referrer',''),
    NULLIF(p_payload->>'landing_page',''),
    COALESCE((p_payload->>'pages_visited')::int, 1),
    v_uid,
    NULLIF(left(p_payload->>'user_agent', 500),''),
    NULLIF(p_payload->>'screen_resolution',''),
    NULLIF(p_payload->>'viewport_size',''),
    NULLIF(p_payload->>'language',''),
    NULLIF(p_payload->>'network_type','')
  )
  ON CONFLICT (session_id) DO UPDATE
  SET device_type = COALESCE(EXCLUDED.device_type, public.visitor_sessions.device_type),
      browser     = COALESCE(EXCLUDED.browser,     public.visitor_sessions.browser),
      os          = COALESCE(EXCLUDED.os,          public.visitor_sessions.os),
      referrer    = COALESCE(EXCLUDED.referrer,    public.visitor_sessions.referrer),
      landing_page= COALESCE(EXCLUDED.landing_page,public.visitor_sessions.landing_page),
      user_agent  = COALESCE(EXCLUDED.user_agent,  public.visitor_sessions.user_agent),
      user_id     = COALESCE(public.visitor_sessions.user_id, v_uid),
      last_activity_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.track_visitor_session_upsert(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_visitor_session_upsert(text, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_visitor_session_update(
  p_session_id text,
  p_patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 8 OR length(p_session_id) > 128 THEN
    RAISE EXCEPTION 'invalid session_id';
  END IF;

  UPDATE public.visitor_sessions vs
  SET pages_visited     = COALESCE((p_patch->>'pages_visited')::int, vs.pages_visited),
      total_time_spent  = COALESCE((p_patch->>'total_time_spent')::int, vs.total_time_spent),
      scroll_depth_max  = GREATEST(COALESCE((p_patch->>'scroll_depth_max')::int, 0), COALESCE(vs.scroll_depth_max, 0)),
      is_converted      = COALESCE((p_patch->>'is_converted')::boolean, vs.is_converted),
      contact_details   = COALESCE(p_patch->'contact_details', vs.contact_details),
      user_id           = COALESCE(vs.user_id, v_uid),
      last_activity_at  = now()
  WHERE vs.session_id = p_session_id
    AND (vs.user_id IS NULL OR vs.user_id = v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.track_visitor_session_update(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_visitor_session_update(text, jsonb) TO anon, authenticated;
