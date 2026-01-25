-- User Activity Tracking System for Admin Dashboard

-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  tool_name TEXT,
  page_path TEXT,
  activity_data JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admin scanned cards table (stores copies of all scanned business cards)
CREATE TABLE IF NOT EXISTS public.admin_scanned_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_card_id UUID,
  card_data JSONB NOT NULL,
  scan_source TEXT DEFAULT 'business_card_scanner',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user chat logs table
CREATE TABLE IF NOT EXISTS public.user_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT,
  chat_type TEXT DEFAULT 'ai_assistant',
  messages JSONB[] DEFAULT ARRAY[]::jsonb[],
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_admin_scanned_cards_user_id ON public.admin_scanned_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_logs_user_id ON public.user_chat_logs(user_id);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_scanned_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_log
-- Users can insert their own activity
CREATE POLICY "Users can insert own activity" ON public.user_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only owner/admin can view all activity (uses has_role function)
CREATE POLICY "Owner can view all activity" ON public.user_activity_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role) OR 
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- RLS Policies for admin_scanned_cards
-- Users can insert their own scanned cards
CREATE POLICY "Users can insert own scanned cards" ON public.admin_scanned_cards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only owner/admin can view all scanned cards
CREATE POLICY "Owner can view all scanned cards" ON public.admin_scanned_cards
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role) OR 
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- RLS Policies for user_chat_logs
-- Users can insert and update their own chat logs
CREATE POLICY "Users can insert own chat logs" ON public.user_chat_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat logs" ON public.user_chat_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only owner/admin can view all chat logs
CREATE POLICY "Owner can view all chat logs" ON public.user_chat_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role) OR 
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Create trigger for updating updated_at on user_chat_logs
CREATE TRIGGER update_user_chat_logs_updated_at
  BEFORE UPDATE ON public.user_chat_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();