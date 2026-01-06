-- Create AI usage logs table for tracking and analytics
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  user_id UUID,
  client_ip_hash TEXT,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_type TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_ai_usage_function ON public.ai_usage_logs(function_name);
CREATE INDEX idx_ai_usage_created ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_user ON public.ai_usage_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ai_usage_success ON public.ai_usage_logs(success);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view usage logs
CREATE POLICY "Admins can view AI usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Service role can insert (edge functions)
CREATE POLICY "Service role can insert AI usage logs"
  ON public.ai_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.ai_usage_logs IS 'Tracks AI API usage across all edge functions for analytics and cost monitoring';