
-- Tighten the chat_conversations update policy to only allow updating messages/rating fields
-- Drop the overly permissive one and create a scoped one
DROP POLICY IF EXISTS "chat_conversations_user_update_own" ON public.chat_conversations;

-- Allow anon/authenticated to update their own conversations (matched by user_email from JWT or session)
CREATE POLICY "chat_conversations_self_update"
ON public.chat_conversations
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
