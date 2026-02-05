-- Add user_id column to chat_conversations for proper access control
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);

-- Drop the insecure email-based SELECT policy
DROP POLICY IF EXISTS "chat_conversations_secure_select" ON public.chat_conversations;

-- Create new secure SELECT policy using user_id instead of email
CREATE POLICY "chat_conversations_secure_select" ON public.chat_conversations
FOR SELECT TO public
USING (
  -- Users can only see their own conversations by user_id
  (user_id = auth.uid())
  -- Staff can see all
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_crm_admin(auth.uid())
);

-- Update INSERT policy to capture user_id when authenticated
DROP POLICY IF EXISTS "Authenticated users can create chat_conversations" ON public.chat_conversations;

CREATE POLICY "Authenticated users can create chat_conversations" ON public.chat_conversations
FOR INSERT TO public
WITH CHECK (
  -- If authenticated, user_id must match current user (or be null for guest)
  (auth.uid() IS NULL OR user_id IS NULL OR user_id = auth.uid())
);