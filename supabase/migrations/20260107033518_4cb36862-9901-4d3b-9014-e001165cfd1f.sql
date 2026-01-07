-- Fix RLS policy that incorrectly queries auth.users (causes: permission denied for table users)
-- Replace it with JWT-claim based email matching.

DROP POLICY IF EXISTS chat_conversations_own_select ON public.chat_conversations;

CREATE POLICY chat_conversations_own_select
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND lower(user_email) = lower(auth.jwt() ->> 'email')
);
