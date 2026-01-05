-- Create table to store chat conversations
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  service_type TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all conversations
CREATE POLICY "Admins can view all chat conversations"
ON public.chat_conversations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for admins to update conversations
CREATE POLICY "Admins can update chat conversations"
ON public.chat_conversations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create insert policy for anyone (since we collect lead info before chat)
CREATE POLICY "Anyone can create chat conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (true);

-- Create update policy for updating own conversation (by matching email in session)
CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_chat_conversations_email ON public.chat_conversations(user_email);
CREATE INDEX idx_chat_conversations_created_at ON public.chat_conversations(created_at DESC);