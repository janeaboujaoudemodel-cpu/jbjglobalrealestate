
-- 2. CRM chat messages: scope SELECT to channel participants + admins
DROP POLICY IF EXISTS "crm_chat_participants_read" ON public.crm_chat_messages;
CREATE POLICY "crm_chat_participants_read"
  ON public.crm_chat_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()::text
    OR channel_id IN (
      SELECT DISTINCT cm.channel_id FROM public.crm_chat_messages cm WHERE cm.sender_id = auth.uid()::text
    )
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
