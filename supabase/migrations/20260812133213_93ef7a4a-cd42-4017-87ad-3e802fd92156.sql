-- 1. chat_conversations: authenticated inserts must use their own verified email
DROP POLICY IF EXISTS chat_conversations_authenticated_insert ON public.chat_conversations;
CREATE POLICY chat_conversations_authenticated_insert
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  user_email IS NOT NULL
  AND user_id = auth.uid()
  AND lower(user_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
);

-- 2. user_role_selections: rate-limit anonymous PII submissions, scope roles
DROP POLICY IF EXISTS "Users can insert own role selection" ON public.user_role_selections;

CREATE POLICY "Authenticated users insert own role selection"
ON public.user_role_selections
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anon role selection rate limited"
ON public.user_role_selections
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND public.check_rate_limit(
    COALESCE(NULLIF(lower(email), ''), NULLIF(session_id, ''), 'anon'),
    'user_role_selection',
    5,
    60
  )
);