
-- Add columns for live agent join feature
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS owner_joined boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_joined_at timestamptz,
ADD COLUMN IF NOT EXISTS owner_name text;

-- Enable realtime for chat_conversations to support live join and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
