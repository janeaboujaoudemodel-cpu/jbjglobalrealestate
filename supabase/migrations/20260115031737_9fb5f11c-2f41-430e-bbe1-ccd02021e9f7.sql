-- VIP Client System Tables

-- Create VIP type enum
CREATE TYPE public.vip_category AS ENUM (
  'government_official',
  'doctor',
  'lawyer',
  'architect',
  'engineer',
  'phd_holder',
  'masters_holder',
  'investor',
  'existing_buyer',
  'loyal_customer'
);

-- Create VIP clients table
CREATE TABLE public.vip_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  nationality TEXT,
  vip_category vip_category NOT NULL,
  profession TEXT,
  job_title TEXT,
  organization TEXT,
  id_document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  hide_from_public BOOLEAN DEFAULT true,
  loyalty_points INTEGER DEFAULT 0,
  properties_purchased INTEGER DEFAULT 0,
  total_investment_value NUMERIC(15, 2) DEFAULT 0,
  special_notes TEXT,
  assigned_relationship_manager UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VIP Events table
CREATE TABLE public.vip_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general', -- gala, dinner, property_tour, gift_delivery, birthday, exclusive_access
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_attendees INTEGER,
  vip_categories_allowed vip_category[] DEFAULT ARRAY['investor', 'existing_buyer', 'loyal_customer']::vip_category[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VIP Event Invitations
CREATE TABLE public.vip_event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.vip_events(id) ON DELETE CASCADE NOT NULL,
  vip_client_id UUID REFERENCES public.vip_clients(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, attended
  response_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, vip_client_id)
);

-- VIP Gifts table
CREATE TABLE public.vip_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_client_id UUID REFERENCES public.vip_clients(id) ON DELETE CASCADE NOT NULL,
  gift_type TEXT NOT NULL, -- birthday, anniversary, purchase_thank_you, holiday, custom
  gift_description TEXT,
  gift_value NUMERIC(10, 2),
  occasion TEXT,
  delivery_date TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'pending', -- pending, shipped, delivered
  tracking_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VIP Loyalty Program table
CREATE TABLE public.vip_loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- discount, exclusive_access, gift, service_upgrade
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VIP Tools Access tracking
CREATE TABLE public.vip_tool_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_client_id UUID REFERENCES public.vip_clients(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  access_granted_at TIMESTAMPTZ DEFAULT now(),
  access_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Contact form rate limiting table
CREATE TABLE public.contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  submission_count INTEGER DEFAULT 1,
  first_submission_at TIMESTAMPTZ DEFAULT now(),
  last_submission_at TIMESTAMPTZ DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for rate limiting lookups
CREATE INDEX idx_contact_form_email_ip ON public.contact_form_submissions(email, ip_address, last_submission_at);
CREATE INDEX idx_vip_clients_email ON public.vip_clients(email);
CREATE INDEX idx_vip_clients_category ON public.vip_clients(vip_category);

-- Enable RLS
ALTER TABLE public.vip_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_tool_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for VIP tables

-- VIP Clients: Only admins can manage, VIP clients can view their own data
CREATE POLICY "Admins can manage VIP clients" ON public.vip_clients
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VIP clients can view own profile" ON public.vip_clients
  FOR SELECT USING (user_id = auth.uid());

-- VIP Events: Admins manage, verified VIPs can view applicable events
CREATE POLICY "Admins can manage VIP events" ON public.vip_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VIPs can view events" ON public.vip_events
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.vip_clients 
      WHERE vip_clients.user_id = auth.uid() 
      AND vip_clients.is_verified = true
      AND vip_clients.vip_category = ANY(vip_categories_allowed)
    )
  );

-- VIP Event Invitations
CREATE POLICY "Admins can manage invitations" ON public.vip_event_invitations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VIPs can view and update own invitations" ON public.vip_event_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vip_clients 
      WHERE vip_clients.id = vip_client_id 
      AND vip_clients.user_id = auth.uid()
    )
  );

-- VIP Gifts: Only admins
CREATE POLICY "Admins can manage VIP gifts" ON public.vip_gifts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- VIP Loyalty Rewards: Public read, admin write
CREATE POLICY "Anyone can view loyalty rewards" ON public.vip_loyalty_rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage loyalty rewards" ON public.vip_loyalty_rewards
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- VIP Tool Access: Admins manage, VIPs can see their own
CREATE POLICY "Admins can manage tool access" ON public.vip_tool_access
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VIPs can view own tool access" ON public.vip_tool_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vip_clients 
      WHERE vip_clients.id = vip_client_id 
      AND vip_clients.user_id = auth.uid()
    )
  );

-- Contact form submissions: Service role only (for edge function)
CREATE POLICY "Service role can manage contact submissions" ON public.contact_form_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- Rate limiting function for contact forms
CREATE OR REPLACE FUNCTION public.check_contact_form_rate_limit(
  p_email TEXT,
  p_ip_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_hour_ago TIMESTAMPTZ := now() - interval '1 hour';
  v_submissions_in_hour INTEGER;
BEGIN
  -- Check recent submissions from this email/IP
  SELECT COUNT(*)
  INTO v_submissions_in_hour
  FROM public.contact_form_submissions
  WHERE (email = p_email OR ip_address = p_ip_address)
    AND last_submission_at > v_hour_ago;

  -- Allow max 5 submissions per hour
  IF v_submissions_in_hour >= 5 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Too many submissions. Please wait before submitting again.',
      'retry_after_minutes', 60
    );
  END IF;

  -- Log this submission
  INSERT INTO public.contact_form_submissions (email, ip_address, last_submission_at)
  VALUES (p_email, p_ip_address, now())
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Add VIP Relationship Manager AI employee
INSERT INTO public.ai_brokers (
  id, 
  name, 
  email, 
  gender, 
  bio, 
  specialization, 
  languages, 
  status, 
  personality_prompt
) VALUES (
  gen_random_uuid(),
  'Victoria Sterling',
  'victoria.sterling@jbj.ae',
  'female',
  'Senior VIP Client Relationship Manager with 15+ years of experience in luxury real estate and high-net-worth client services. Expert in organizing exclusive events, managing VIP portfolios, and providing white-glove concierge services to government officials, investors, and distinguished professionals.',
  ARRAY['VIP Client Relations', 'Luxury Events', 'High-Net-Worth Services', 'Government Liaison', 'Investor Relations'],
  ARRAY['English', 'Arabic', 'French'],
  'active',
  'You are Victoria Sterling, Senior VIP Client Relationship Manager at JBJ Global Real Estate. You provide white-glove service to our most distinguished clients including government officials, investors, doctors, lawyers, and other professionals. You organize exclusive events, manage VIP gifts and celebrations, and ensure every VIP receives personalized attention. You are elegant, discreet, professional, and always maintain the highest standards of service excellence.'
);

-- Update updated_at trigger for VIP tables
CREATE TRIGGER update_vip_clients_updated_at
  BEFORE UPDATE ON public.vip_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vip_events_updated_at
  BEFORE UPDATE ON public.vip_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();