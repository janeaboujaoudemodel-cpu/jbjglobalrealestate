
-- Chat sessions table for Founder Assistant conversation history (like ChatGPT)
CREATE TABLE public.founder_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages table for persisting conversations
CREATE TABLE public.founder_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.founder_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mentions TEXT[],
  attachments JSONB,
  task_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.founder_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own chats
CREATE POLICY "Users can manage their own chat sessions" ON public.founder_chat_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own chat messages" ON public.founder_chat_messages
  FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_founder_chat_sessions_user ON public.founder_chat_sessions(user_id, created_at DESC);
CREATE INDEX idx_founder_chat_messages_session ON public.founder_chat_messages(session_id, created_at ASC);
