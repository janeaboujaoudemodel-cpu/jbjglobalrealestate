CREATE UNIQUE INDEX IF NOT EXISTS owner_comm_messages_user_external_uniq
  ON public.owner_comm_messages (user_id, external_message_id)
  WHERE external_message_id IS NOT NULL;