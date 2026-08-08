CREATE OR REPLACE FUNCTION public.email_belongs_to_registered_user(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(_email));
$$;

REVOKE ALL ON FUNCTION public.email_belongs_to_registered_user(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_belongs_to_registered_user(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS chat_conversations_anon_insert ON public.chat_conversations;
CREATE POLICY chat_conversations_anon_insert
ON public.chat_conversations
FOR INSERT
TO anon
WITH CHECK (
  user_email IS NOT NULL
  AND user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT is_email_domain_blocked(user_email)
  AND check_rate_limit(COALESCE(user_email, 'anon'), 'chat_conversation', 10, 60)
  AND user_id IS NULL
  AND identity_verified = false
  AND NOT public.email_belongs_to_registered_user(user_email)
);