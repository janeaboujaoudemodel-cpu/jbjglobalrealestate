-- Add broker to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'broker';

-- Create brokers table
CREATE TABLE IF NOT EXISTS public.jbj_brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    capacity INTEGER DEFAULT 150,
    active_leads INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'offline')),
    specialization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.jbj_brokers ENABLE ROW LEVEL SECURITY;

-- Create leads table
CREATE TABLE IF NOT EXISTS public.jbj_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost')),
    assigned_broker_id UUID REFERENCES public.jbj_brokers(id) ON DELETE SET NULL,
    notes TEXT,
    property_interest TEXT,
    budget_range TEXT,
    source TEXT,
    last_contact TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.jbj_leads ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE IF NOT EXISTS public.jbj_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.jbj_leads(id) ON DELETE CASCADE NOT NULL,
    broker_id UUID REFERENCES public.jbj_brokers(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'call', 'video')),
    direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    content TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'blocked')),
    was_filtered BOOLEAN DEFAULT false,
    filter_reason TEXT,
    call_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.jbj_messages ENABLE ROW LEVEL SECURITY;

-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.jbj_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_name TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.jbj_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create message filters table
CREATE TABLE IF NOT EXISTS public.jbj_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    filter_type TEXT DEFAULT 'block' CHECK (filter_type IN ('block', 'warn', 'replace')),
    replacement_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.jbj_filters ENABLE ROW LEVEL SECURITY;

-- Create daily reports table
CREATE TABLE IF NOT EXISTS public.jbj_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID REFERENCES public.jbj_brokers(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    leads_contacted INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(broker_id, report_date)
);

ALTER TABLE public.jbj_daily_reports ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for jbj_brokers
CREATE POLICY "Anyone can view brokers"
ON public.jbj_brokers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage brokers"
ON public.jbj_brokers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jbj_leads
CREATE POLICY "Brokers can view assigned leads"
ON public.jbj_leads FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    assigned_broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Brokers can update assigned leads"
ON public.jbj_leads FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    assigned_broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can insert leads"
ON public.jbj_leads FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
ON public.jbj_leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jbj_messages
CREATE POLICY "Brokers can view their messages"
ON public.jbj_messages FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Brokers can insert messages"
ON public.jbj_messages FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

-- RLS Policies for jbj_activity_logs
CREATE POLICY "Admins can view all activity"
ON public.jbj_activity_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert activity logs"
ON public.jbj_activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for jbj_filters
CREATE POLICY "Anyone can view filters"
ON public.jbj_filters FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage filters"
ON public.jbj_filters FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jbj_daily_reports
CREATE POLICY "Brokers can view their reports"
ON public.jbj_daily_reports FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    broker_id IN (SELECT id FROM public.jbj_brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Anyone can insert reports"
ON public.jbj_daily_reports FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update reports"
ON public.jbj_daily_reports FOR UPDATE
TO authenticated
USING (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
DROP TRIGGER IF EXISTS update_jbj_brokers_updated_at ON public.jbj_brokers;
CREATE TRIGGER update_jbj_brokers_updated_at
    BEFORE UPDATE ON public.jbj_brokers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_jbj_leads_updated_at ON public.jbj_leads;
CREATE TRIGGER update_jbj_leads_updated_at
    BEFORE UPDATE ON public.jbj_leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default brokers
INSERT INTO public.jbj_brokers (name, email, specialization, avatar_url) VALUES
('James Morgan', 'james@jbj.ae', 'International Clients', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
('Maya Khalid', 'maya@jbj.ae', 'GCC & Local Clients', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face')
ON CONFLICT (email) DO NOTHING;

-- Insert default filters
INSERT INTO public.jbj_filters (keyword, filter_type) VALUES
('competitor', 'block'),
('discount unauthorized', 'block'),
('personal phone', 'block'),
('off market deal', 'block')
ON CONFLICT DO NOTHING;