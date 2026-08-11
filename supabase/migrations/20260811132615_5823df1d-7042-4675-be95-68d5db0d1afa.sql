-- The SECURITY DEFINER logger bypasses RLS, so it must enforce the same rule
-- as the tightened chat_history insert policies: only staff (or the service
-- role running an edge function) may attribute a message to the assistant.
CREATE OR REPLACE FUNCTION public.log_chat_message(
  p_session_id text,
  p_role text,
  p_message text,
  p_source text,
  p_source_page text DEFAULT NULL::text,
  p_user_name text DEFAULT NULL::text,
  p_user_email text DEFAULT NULL::text,
  p_user_phone text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_chat_id UUID;
  v_role TEXT;
  v_privileged BOOLEAN;
BEGIN
  -- Derive user_id from auth context (never accept from input)
  v_user_id := auth.uid();

  -- Validate required fields
  IF p_session_id IS NULL OR length(p_session_id) < 10 THEN
    RAISE EXCEPTION 'Invalid session_id';
  END IF;

  IF p_message IS NULL OR length(p_message) = 0 THEN
    RAISE EXCEPTION 'Message is required';
  END IF;

  IF p_role NOT IN ('user', 'assistant', 'system') THEN
    RAISE EXCEPTION 'Invalid role: must be user, assistant, or system';
  END IF;

  -- Anti-spoofing: a normal visitor may only speak as themselves. Assistant /
  -- system attribution is reserved for staff and for service-role callers
  -- (edge functions), which have no auth.uid().
  v_privileged := (
    v_user_id IS NULL
    OR has_role(v_user_id, 'admin'::app_role)
    OR has_role(v_user_id, 'owner'::app_role)
  );

  v_role := CASE WHEN v_privileged THEN p_role ELSE 'user' END;

  INSERT INTO public.chat_history (
    session_id,
    role,
    message,
    source,
    source_page,
    user_id,
    user_name,
    user_email,
    user_phone,
    metadata
  ) VALUES (
    p_session_id,
    v_role,
    p_message,
    p_source,
    COALESCE(p_source_page, '/'),
    v_user_id,  -- Always from auth context, never from input
    p_user_name,
    p_user_email,
    p_user_phone,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_chat_id;

  RETURN v_chat_id;
END;
$function$;