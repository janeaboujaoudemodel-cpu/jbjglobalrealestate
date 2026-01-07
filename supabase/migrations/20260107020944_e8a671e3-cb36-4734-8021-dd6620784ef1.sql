-- Tighten public INSERT policies and remove permissive UPDATE on chat_conversations

-- chat_conversations: remove permissive update + tighten insert
DROP POLICY IF EXISTS "Users can update own chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert chat_conversations" ON public.chat_conversations;

CREATE POLICY "Anyone can insert chat_conversations"
ON public.chat_conversations
FOR INSERT TO anon, authenticated
WITH CHECK (
  user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
  AND status = 'active'
);

CREATE POLICY "Admins can update chat_conversations"
ON public.chat_conversations
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- leads: tighten insert (removes WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT TO anon, authenticated
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
  AND source IS NOT NULL
);
