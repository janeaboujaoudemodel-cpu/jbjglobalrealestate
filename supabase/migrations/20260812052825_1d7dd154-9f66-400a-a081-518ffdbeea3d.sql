ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS guest_token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_conversations_guest_token_hash
  ON public.chat_conversations (guest_token_hash)
  WHERE guest_token_hash IS NOT NULL;