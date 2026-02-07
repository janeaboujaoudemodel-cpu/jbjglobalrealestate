-- Create voice call logs table for Voice Concierge tracking
CREATE TABLE public.voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own call logs
CREATE POLICY "Users can view their own voice call logs"
ON public.voice_call_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own call logs
CREATE POLICY "Users can insert their own voice call logs"
ON public.voice_call_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own call logs
CREATE POLICY "Users can update their own voice call logs"
ON public.voice_call_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_voice_call_logs_user_id ON public.voice_call_logs(user_id);
CREATE INDEX idx_voice_call_logs_started_at ON public.voice_call_logs(started_at DESC);