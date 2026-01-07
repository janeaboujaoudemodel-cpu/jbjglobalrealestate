-- Lock down sensitive broker subscription data
ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broker_subscriptions_select_own_or_admin" ON public.broker_subscriptions;
CREATE POLICY "broker_subscriptions_select_own_or_admin"
ON public.broker_subscriptions
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "broker_subscriptions_insert_own_or_admin" ON public.broker_subscriptions;
CREATE POLICY "broker_subscriptions_insert_own_or_admin"
ON public.broker_subscriptions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "broker_subscriptions_update_own_or_admin" ON public.broker_subscriptions;
CREATE POLICY "broker_subscriptions_update_own_or_admin"
ON public.broker_subscriptions
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "broker_subscriptions_delete_own_or_admin" ON public.broker_subscriptions;
CREATE POLICY "broker_subscriptions_delete_own_or_admin"
ON public.broker_subscriptions
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);


-- Lock down customer chat conversation history (PII + transcripts)
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_conversations_admin_select" ON public.chat_conversations;
CREATE POLICY "chat_conversations_admin_select"
ON public.chat_conversations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "chat_conversations_admin_update" ON public.chat_conversations;
CREATE POLICY "chat_conversations_admin_update"
ON public.chat_conversations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "chat_conversations_admin_delete" ON public.chat_conversations;
CREATE POLICY "chat_conversations_admin_delete"
ON public.chat_conversations
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "chat_conversations_public_insert" ON public.chat_conversations;
CREATE POLICY "chat_conversations_public_insert"
ON public.chat_conversations
FOR INSERT
WITH CHECK (
  user_email IS NOT NULL
  AND length(trim(user_email)) > 3
);
