-- Create table for persisting CRM internal chat messages
CREATE TABLE public.crm_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_from_current_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast channel lookups
CREATE INDEX idx_crm_chat_messages_channel ON public.crm_chat_messages(channel_id);
CREATE INDEX idx_crm_chat_messages_created ON public.crm_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.crm_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all messages (internal team chat)
CREATE POLICY "Authenticated users can read chat messages"
ON public.crm_chat_messages
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert messages
CREATE POLICY "Authenticated users can send chat messages"
ON public.crm_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create table for CRM action logs (WhatsApp, Email, Call, Video)
CREATE TABLE public.crm_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  lead_id TEXT,
  employee_id TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('whatsapp', 'email', 'call', 'video', 'chat')),
  target_name TEXT,
  target_contact TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for action logs
CREATE INDEX idx_crm_action_logs_user ON public.crm_action_logs(user_id);
CREATE INDEX idx_crm_action_logs_lead ON public.crm_action_logs(lead_id);
CREATE INDEX idx_crm_action_logs_created ON public.crm_action_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.crm_action_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own action logs
CREATE POLICY "Users can read own action logs"
ON public.crm_action_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert action logs
CREATE POLICY "Users can create action logs"
ON public.crm_action_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);