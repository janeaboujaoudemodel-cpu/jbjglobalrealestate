-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Comprehensive protection for sensitive data
-- =====================================================

-- 1. Create security audit table for tracking all access
CREATE TABLE IF NOT EXISTS public.security_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, action_type, window_start)
);

-- 3. Create broker call logs table
CREATE TABLE IF NOT EXISTS public.broker_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  call_type TEXT DEFAULT 'outbound',
  call_status TEXT DEFAULT 'completed',
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create broker chat logs table
CREATE TABLE IF NOT EXISTS public.broker_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  platform TEXT DEFAULT 'whatsapp',
  contact_number TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create broker activity summary view
CREATE TABLE IF NOT EXISTS public.broker_activity_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made INTEGER DEFAULT 0,
  chats_sent INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  visits_completed INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on all new tables
ALTER TABLE public.security_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_activity_stats ENABLE ROW LEVEL SECURITY;

-- RLS for security_access_logs (admins only)
CREATE POLICY "Only admins can view security logs" ON public.security_access_logs
  FOR SELECT USING (public.is_owner_or_admin(auth.uid()));
CREATE POLICY "System can insert security logs" ON public.security_access_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS for rate_limit_records (system only via service role)
CREATE POLICY "No direct access to rate limits" ON public.rate_limit_records
  FOR ALL USING (false);

-- RLS for broker_call_logs
CREATE POLICY "Brokers can view own call logs" ON public.broker_call_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Brokers can insert own call logs" ON public.broker_call_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Brokers can update own call logs" ON public.broker_call_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all call logs" ON public.broker_call_logs
  FOR SELECT TO authenticated USING (public.is_owner_or_admin(auth.uid()));

-- RLS for broker_chat_logs
CREATE POLICY "Brokers can view own chat logs" ON public.broker_chat_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Brokers can insert own chat logs" ON public.broker_chat_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Brokers can update own chat logs" ON public.broker_chat_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all chat logs" ON public.broker_chat_logs
  FOR SELECT TO authenticated USING (public.is_owner_or_admin(auth.uid()));

-- RLS for broker_activity_stats
CREATE POLICY "Brokers can view own stats" ON public.broker_activity_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Brokers can upsert own stats" ON public.broker_activity_stats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Brokers can update own stats" ON public.broker_activity_stats
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all stats" ON public.broker_activity_stats
  FOR SELECT TO authenticated USING (public.is_owner_or_admin(auth.uid()));

-- 6. HARDEN EXISTING POLICIES - Remove public access to sensitive data

-- Fix developer_sales_reps - require authentication
DROP POLICY IF EXISTS "Anyone can view active sales reps" ON public.developer_sales_reps;
CREATE POLICY "Authenticated users can view active sales reps" ON public.developer_sales_reps
  FOR SELECT TO authenticated USING (is_active = true);

-- Fix broker_profiles - require authentication for viewing
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.broker_profiles;
CREATE POLICY "Authenticated users can view public broker profiles" ON public.broker_profiles
  FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);

-- 7. Add indexes for performance on security tables
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON public.security_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limit_records(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_call_logs_user ON public.broker_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON public.broker_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user ON public.broker_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_stats_user_date ON public.broker_activity_stats(user_id, date);

-- 8. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_failure_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.security_access_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    success,
    failure_reason,
    metadata
  ) VALUES (
    auth.uid(),
    auth.jwt() ->> 'email',
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_success,
    p_failure_reason,
    p_metadata
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 9. Create function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('minute', now()) - (p_window_minutes * interval '1 minute');
  
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_count
  FROM public.rate_limit_records
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND window_start >= v_window_start;
  
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  INSERT INTO public.rate_limit_records (identifier, action_type, window_start, request_count)
  VALUES (p_identifier, p_action_type, date_trunc('minute', now()), 1)
  ON CONFLICT (identifier, action_type, window_start) 
  DO UPDATE SET request_count = rate_limit_records.request_count + 1;
  
  RETURN true;
END;
$$;

-- 10. Create trigger for updating activity stats
CREATE TRIGGER update_broker_activity_stats_updated_at
  BEFORE UPDATE ON public.broker_activity_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Cleanup old rate limit records (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_records()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limit_records
  WHERE window_start < now() - interval '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;