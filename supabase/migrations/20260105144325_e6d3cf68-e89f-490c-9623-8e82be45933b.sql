-- Add user_role column to broker_subscriptions for role-based access
ALTER TABLE public.broker_subscriptions 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'broker' CHECK (user_role IN ('broker', 'sales_agent', 'investor'));

-- Add selected_addons column for customizable packages
ALTER TABLE public.broker_subscriptions 
ADD COLUMN IF NOT EXISTS selected_addons TEXT[] DEFAULT '{}';

-- Add device fingerprints for security (stores hashed device IDs)
ALTER TABLE public.broker_subscriptions 
ADD COLUMN IF NOT EXISTS device_fingerprints TEXT[] DEFAULT '{}';

-- Add last_device_fingerprint for tracking current session
ALTER TABLE public.broker_subscriptions 
ADD COLUMN IF NOT EXISTS last_device_fingerprint TEXT;

-- Add terms_accepted_at for legal compliance
ALTER TABLE public.broker_subscriptions 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add ip_addresses for additional security tracking
ALTER TABLE public.broker_subscriptions 
ADD COLUMN IF NOT EXISTS registered_ips TEXT[] DEFAULT '{}';

-- Create table for course content access tracking (session-based)
CREATE TABLE IF NOT EXISTS public.course_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.broker_subscriptions(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  session_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  content_accessed TEXT[] DEFAULT '{}',
  suspicious_activity BOOLEAN DEFAULT false,
  suspicious_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on course_sessions
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.course_sessions
FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own sessions
CREATE POLICY "Users can create their own sessions"
ON public.course_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions (for activity tracking)
CREATE POLICY "Users can update their own sessions"
ON public.course_sessions
FOR UPDATE
USING (user_id = auth.uid());

-- Create table for content watermarks (tracking who accessed what)
CREATE TABLE IF NOT EXISTS public.content_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.broker_subscriptions(id),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'document', 'lesson')),
  watermark_id TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false
);

-- Enable RLS on content_access_logs
ALTER TABLE public.content_access_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own access logs
CREATE POLICY "Users can view their own access logs"
ON public.content_access_logs
FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own access logs
CREATE POLICY "Users can create their own access logs"
ON public.content_access_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all logs for security monitoring
CREATE POLICY "Admins can view all access logs"
ON public.content_access_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create add-on tools pricing table
CREATE TABLE IF NOT EXISTS public.addon_tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  price_aed NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('tools', 'courses', 'support')),
  is_active BOOLEAN DEFAULT true,
  included_in_tiers TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on addon_tools (public read, admin write)
ALTER TABLE public.addon_tools ENABLE ROW LEVEL SECURITY;

-- Everyone can view active add-ons
CREATE POLICY "Anyone can view active addons"
ON public.addon_tools
FOR SELECT
USING (is_active = true);

-- Only admins can manage add-ons
CREATE POLICY "Admins can manage addons"
ON public.addon_tools
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default add-on tools
INSERT INTO public.addon_tools (id, name, description, price_usd, price_aed, category, included_in_tiers) VALUES
  ('pdf_generator', 'PDF Property Report Generator', 'Create stunning property presentations with your branding', 29, 107, 'tools', '{"starter","professional","enterprise"}'),
  ('ai_comparison', 'AI Property Comparison', 'Generate detailed comparison tables for multiple properties', 49, 180, 'tools', '{"professional","enterprise"}'),
  ('ai_recommendation', 'AI Recommendation Engine', 'Let AI recommend the best property for your client', 49, 180, 'tools', '{"professional","enterprise"}'),
  ('custom_branding', 'Custom Branding Editor', 'Add your logo, photo, and contact details to exports', 19, 70, 'tools', '{"professional","enterprise"}'),
  ('excel_export', 'Excel Data Export', 'Export property data to Excel for detailed analysis', 19, 70, 'tools', '{"enterprise"}'),
  ('bulk_download', 'Bulk Download Manager', 'Download multiple property materials at once', 29, 107, 'tools', '{"enterprise"}'),
  ('closing_course', 'Closing Techniques Course', 'Master the art of closing deals with proven techniques', 99, 364, 'courses', '{"starter","professional","enterprise"}'),
  ('objection_course', 'Objection Handling Course', 'Turn objections into opportunities', 79, 290, 'courses', '{"professional","enterprise"}'),
  ('lead_gen_course', 'Lead Generation Course', 'Build a consistent pipeline of qualified leads', 99, 364, 'courses', '{"professional","enterprise"}'),
  ('lead_mgmt_course', 'Lead Management System Course', 'Organize and nurture leads effectively', 59, 217, 'courses', '{"enterprise"}'),
  ('prospecting_course', 'Prospecting Mastery Course', 'Find and qualify potential clients', 79, 290, 'courses', '{"enterprise"}'),
  ('market_course', 'Market Expertise Course', 'Deep dive into UAE real estate market', 99, 364, 'courses', '{"enterprise"}'),
  ('priority_support', 'Priority Email & Chat Support', '24/7 priority support access', 29, 107, 'support', '{"professional","enterprise"}'),
  ('live_qa', 'Monthly Live Q&A Sessions', 'Join exclusive Q&A with industry experts', 49, 180, 'support', '{"professional","enterprise"}'),
  ('mentorship', 'Monthly 1-on-1 Mentorship Calls', 'Personal coaching from industry veterans', 199, 731, 'support', '{"enterprise"}')
ON CONFLICT (id) DO NOTHING;