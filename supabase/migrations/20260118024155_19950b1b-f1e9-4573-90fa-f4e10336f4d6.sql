-- Create visitor_sessions table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_fingerprint TEXT,
  first_visit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  landing_page TEXT,
  pages_visited INTEGER DEFAULT 1,
  total_time_spent INTEGER DEFAULT 0,
  scroll_depth_max INTEGER DEFAULT 0,
  is_bounced BOOLEAN DEFAULT false,
  is_converted BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visitor_events table for tracking all actions
CREATE TABLE IF NOT EXISTS public.visitor_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  page_path TEXT,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visitor_documents table for tracking uploads/downloads
CREATE TABLE IF NOT EXISTS public.visitor_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT,
  document_url TEXT,
  action TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_gating_submissions for first-time form fills
CREATE TABLE IF NOT EXISTS public.contact_gating_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  nationality TEXT,
  location TEXT,
  preferred_language TEXT DEFAULT 'english',
  service_interest TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_gating_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visitor_sessions
CREATE POLICY "Anyone can insert visitor sessions" ON public.visitor_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all visitor sessions" ON public.visitor_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.broker_subscriptions WHERE user_id = auth.uid() AND tier IN ('enterprise', 'founder'))
);

-- RLS Policies for visitor_events
CREATE POLICY "Anyone can insert visitor events" ON public.visitor_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all visitor events" ON public.visitor_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.broker_subscriptions WHERE user_id = auth.uid() AND tier IN ('enterprise', 'founder'))
);

-- RLS Policies for visitor_documents
CREATE POLICY "Anyone can insert visitor documents" ON public.visitor_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all visitor documents" ON public.visitor_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.broker_subscriptions WHERE user_id = auth.uid() AND tier IN ('enterprise', 'founder'))
);

-- RLS Policies for contact_gating_submissions
CREATE POLICY "Anyone can insert contact gating submissions" ON public.contact_gating_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all contact gating submissions" ON public.contact_gating_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.broker_subscriptions WHERE user_id = auth.uid() AND tier IN ('enterprise', 'founder'))
);
CREATE POLICY "Users can view their own submissions" ON public.contact_gating_submissions FOR SELECT USING (
  email = (SELECT email FROM public.broker_subscriptions WHERE user_id = auth.uid() LIMIT 1)
);

-- Create indexes for performance
CREATE INDEX idx_visitor_sessions_session_id ON public.visitor_sessions(session_id);
CREATE INDEX idx_visitor_events_session_id ON public.visitor_events(session_id);
CREATE INDEX idx_visitor_events_created_at ON public.visitor_events(created_at);
CREATE INDEX idx_visitor_documents_session_id ON public.visitor_documents(session_id);
CREATE INDEX idx_contact_gating_email ON public.contact_gating_submissions(email);