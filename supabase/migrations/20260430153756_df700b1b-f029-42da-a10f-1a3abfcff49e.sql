-- Deduplication hard guards for inbound communication sync.
-- 1) Messages: external_message_id is unique per (user_id, channel_type-equivalent via thread).
--    We enforce uniqueness on (user_id, external_message_id) when external_message_id is present.
CREATE UNIQUE INDEX IF NOT EXISTS owner_comm_messages_external_id_unique
  ON public.owner_comm_messages (user_id, external_message_id)
  WHERE external_message_id IS NOT NULL;

-- 2) Threads: one thread per (user_id, channel_type, contact_identifier).
--    Normalize contact_identifier in code (lower-cased) so equality matches reliably.
CREATE UNIQUE INDEX IF NOT EXISTS owner_comm_threads_user_channel_contact_unique
  ON public.owner_comm_threads (user_id, channel_type, contact_identifier);
