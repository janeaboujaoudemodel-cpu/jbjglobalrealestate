CREATE OR REPLACE FUNCTION public.track_user_session_update(p_session_id text, p_patch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pages int;
  v_duration int;
  v_ended timestamptz;
  v_uid uuid := auth.uid();
BEGIN
  IF p_session_id IS NULL OR char_length(p_session_id) < 8 OR char_length(p_session_id) > 128 THEN
    RETURN;
  END IF;

  v_pages := NULLIF(p_patch->>'pages_visited','')::int;
  v_duration := NULLIF(p_patch->>'duration_seconds','')::int;
  v_ended := NULLIF(p_patch->>'ended_at','')::timestamptz;

  IF v_pages IS NOT NULL AND (v_pages < 0 OR v_pages > 10000) THEN v_pages := NULL; END IF;
  IF v_duration IS NOT NULL AND (v_duration < 0 OR v_duration > 86400) THEN v_duration := NULL; END IF;

  UPDATE public.user_sessions s
     SET pages_visited    = COALESCE(v_pages, s.pages_visited),
         duration_seconds = COALESCE(v_duration, s.duration_seconds),
         ended_at         = COALESCE(v_ended, s.ended_at),
         user_id          = COALESCE(s.user_id, v_uid),
         is_authenticated = CASE WHEN COALESCE(s.user_id, v_uid) IS NOT NULL THEN true ELSE s.is_authenticated END
   WHERE s.session_id = p_session_id
     AND (s.user_id IS NULL OR s.user_id = v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.track_user_session_update(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_user_session_update(text, jsonb) TO anon, authenticated, service_role;