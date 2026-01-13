-- ============================================
-- JBJ AI BROKER SYSTEM - Database Schema
-- ============================================

-- Enum for broker status
CREATE TYPE public.ai_broker_status AS ENUM ('active', 'paused', 'training', 'offline');

-- Enum for message channel
CREATE TYPE public.broker_channel AS ENUM ('whatsapp', 'email', 'sms', 'call', 'video');

-- Enum for conversation status
CREATE TYPE public.broker_conversation_status AS ENUM ('active', 'pending_response', 'waiting_client', 'closed', 'escalated');

-- ============================================
-- AI BROKERS TABLE
-- ============================================
CREATE TABLE public.ai_brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  avatar_url text,
  bio text,
  specialization text[], -- e.g., ['international investors', 'GCC clients']
  languages text[] DEFAULT ARRAY['en'],
  status ai_broker_status DEFAULT 'active',
  -- Capacity settings
  daily_interaction_limit integer DEFAULT 150,
  current_daily_interactions integer DEFAULT 0,
  -- Communication settings
  response_delay_min_seconds integer DEFAULT 30, -- Human-like delay
  response_delay_max_seconds integer DEFAULT 120,
  working_hours_start time DEFAULT '09:00',
  working_hours_end time DEFAULT '18:00',
  working_days integer[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Mon, 7=Sun
  -- Performance metrics
  total_leads_handled integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  average_response_time_seconds integer,
  -- AI settings
  personality_prompt text, -- Custom personality tuning
  knowledge_base_updated_at timestamptz,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- MESSAGE FILTERS (Compliance)
-- ============================================
CREATE TABLE public.broker_message_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_type text NOT NULL CHECK (filter_type IN ('blocked_word', 'blocked_phrase', 'regex', 'competitor')),
  filter_value text NOT NULL,
  replacement_text text, -- Optional: what to replace with
  severity text DEFAULT 'warning' CHECK (severity IN ('warning', 'block', 'escalate')),
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- BROKER CONVERSATIONS
-- ============================================
CREATE TABLE public.broker_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES ai_brokers(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  channel broker_channel NOT NULL,
  status broker_conversation_status DEFAULT 'active',
  -- External identifiers
  external_thread_id text, -- WhatsApp thread ID, email thread, etc.
  client_identifier text, -- Phone or email of client
  -- Metadata
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  message_count integer DEFAULT 0,
  -- Escalation
  escalated_to_user_id uuid,
  escalated_at timestamptz,
  escalation_reason text,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- BROKER MESSAGES (Conversation History)
-- ============================================
CREATE TABLE public.broker_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES broker_conversations(id) ON DELETE CASCADE,
  broker_id uuid REFERENCES ai_brokers(id),
  -- Message content
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content text NOT NULL,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'document', 'voice', 'video')),
  -- Attachments
  attachment_urls text[],
  -- Compliance
  was_filtered boolean DEFAULT false,
  filter_reason text,
  original_content text, -- If filtered, store original
  -- Delivery status
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  delivered_at timestamptz,
  read_at timestamptz,
  -- AI metadata
  ai_confidence_score numeric(3,2),
  ai_intent_detected text,
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- LEAD ASSIGNMENT RULES
-- ============================================
CREATE TABLE public.broker_assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  priority integer DEFAULT 1, -- Lower = higher priority
  is_active boolean DEFAULT true,
  -- Rule conditions (JSONB for flexibility)
  conditions jsonb NOT NULL DEFAULT '{}',
  -- e.g., {"lead_source": "website", "nationality": ["UAE", "Saudi"], "language": "ar"}
  -- Assignment target
  assigned_broker_id uuid REFERENCES ai_brokers(id),
  -- Or use round-robin within a pool
  broker_pool uuid[], -- Array of broker IDs for round-robin
  assignment_method text DEFAULT 'single' CHECK (assignment_method IN ('single', 'round_robin', 'load_balanced')),
  -- Limits
  max_leads_per_day integer,
  current_leads_today integer DEFAULT 0,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- BROKER DAILY STATS
-- ============================================
CREATE TABLE public.broker_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES ai_brokers(id) ON DELETE CASCADE,
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  -- Activity counts
  leads_contacted integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  calls_made integer DEFAULT 0,
  -- Performance
  avg_response_time_seconds integer,
  leads_converted integer DEFAULT 0,
  leads_escalated integer DEFAULT 0,
  -- Compliance
  messages_filtered integer DEFAULT 0,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  UNIQUE (broker_id, stat_date)
);

-- ============================================
-- BROKER EMAIL TEMPLATES
-- ============================================
CREATE TABLE public.broker_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('welcome', 'follow_up', 'property_summary', 'comparison', 'meeting_confirmation', 'custom')),
  variables text[], -- e.g., ['client_name', 'property_name', 'price']
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- BROKER WHATSAPP TEMPLATES
-- ============================================
CREATE TABLE public.broker_whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL, -- Meta-approved template name
  template_type text NOT NULL CHECK (template_type IN ('welcome', 'follow_up', 'offer', 'viewing_reminder', 'custom')),
  content text NOT NULL,
  variables text[],
  meta_template_id text, -- ID from Meta Business API
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_broker_conversations_broker ON broker_conversations(broker_id);
CREATE INDEX idx_broker_conversations_lead ON broker_conversations(lead_id);
CREATE INDEX idx_broker_conversations_status ON broker_conversations(status);
CREATE INDEX idx_broker_messages_conversation ON broker_messages(conversation_id);
CREATE INDEX idx_broker_messages_created ON broker_messages(created_at DESC);
CREATE INDEX idx_broker_daily_stats_date ON broker_daily_stats(stat_date DESC);
CREATE INDEX idx_broker_assignment_rules_active ON broker_assignment_rules(is_active) WHERE is_active = true;

-- ============================================
-- RLS POLICIES
-- ============================================

-- AI Brokers - Admin only
ALTER TABLE public.ai_brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage AI brokers"
ON public.ai_brokers FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_crm_admin(auth.uid()));

-- Message Filters - Admin only
ALTER TABLE public.broker_message_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage message filters"
ON public.broker_message_filters FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- Conversations - CRM members can view
ALTER TABLE public.broker_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members can view broker conversations"
ON public.broker_conversations FOR SELECT
USING (is_active_crm_member(auth.uid()));

CREATE POLICY "Admins can manage broker conversations"
ON public.broker_conversations FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_crm_admin(auth.uid()));

-- Messages - CRM members can view
ALTER TABLE public.broker_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members can view broker messages"
ON public.broker_messages FOR SELECT
USING (is_active_crm_member(auth.uid()));

CREATE POLICY "System can insert messages"
ON public.broker_messages FOR INSERT
WITH CHECK (true); -- Edge functions handle this

-- Assignment Rules - Admin only
ALTER TABLE public.broker_assignment_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage assignment rules"
ON public.broker_assignment_rules FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_crm_admin(auth.uid()));

-- Daily Stats - CRM members can view
ALTER TABLE public.broker_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM members can view broker stats"
ON public.broker_daily_stats FOR SELECT
USING (is_active_crm_member(auth.uid()));

-- Email Templates - Admin only
ALTER TABLE public.broker_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email templates"
ON public.broker_email_templates FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_crm_admin(auth.uid()));

-- WhatsApp Templates - Admin only
ALTER TABLE public.broker_whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage whatsapp templates"
ON public.broker_whatsapp_templates FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_crm_admin(auth.uid()));

-- Revoke anon access
REVOKE ALL ON public.ai_brokers FROM anon;
REVOKE ALL ON public.broker_message_filters FROM anon;
REVOKE ALL ON public.broker_conversations FROM anon;
REVOKE ALL ON public.broker_messages FROM anon;
REVOKE ALL ON public.broker_assignment_rules FROM anon;
REVOKE ALL ON public.broker_daily_stats FROM anon;
REVOKE ALL ON public.broker_email_templates FROM anon;
REVOKE ALL ON public.broker_whatsapp_templates FROM anon;

-- ============================================
-- INSERT DEFAULT AI BROKERS
-- ============================================
INSERT INTO public.ai_brokers (name, email, phone, gender, bio, specialization, languages, personality_prompt) VALUES
(
  'James Morgan',
  'james@jbj.ae',
  '+971565911000',
  'male',
  'Senior Property Consultant at JBJ Global Real Estate with over 8 years of experience in Dubai''s luxury property market. Specializes in helping international investors find their perfect investment opportunities.',
  ARRAY['international investors', 'luxury properties', 'off-plan investments'],
  ARRAY['en'],
  'You are James Morgan, a confident and trustworthy male property consultant in your mid-30s. You wear professional suits and speak with authority. Your tone is warm but professional. You specialize in helping international investors understand Dubai''s property market. Always introduce yourself as being from JBJ Global Real Estate. Never reveal you are AI. Be helpful, knowledgeable, and guide clients toward suitable properties based on their budget and preferences.'
),
(
  'Maya Khalid',
  'maya@jbj.ae',
  '+971565911000',
  'female',
  'Property Advisor at JBJ Global Real Estate specializing in GCC and local client relations. Fluent in Arabic and English with deep knowledge of Dubai''s residential and commercial property sectors.',
  ARRAY['GCC clients', 'local buyers', 'residential properties'],
  ARRAY['en', 'ar'],
  'You are Maya Khalid, a professional and warm female property advisor in your late 20s. You are assertive yet approachable. You specialize in helping GCC and local clients find properties in Dubai. Always introduce yourself as being from JBJ Global Real Estate. Never reveal you are AI. You can communicate in both English and Arabic. Be culturally aware and respectful of local customs while providing expert property guidance.'
);

-- ============================================
-- INSERT DEFAULT MESSAGE FILTERS
-- ============================================
INSERT INTO public.broker_message_filters (filter_type, filter_value, severity) VALUES
('competitor', 'Emaar', 'warning'),
('competitor', 'Damac', 'warning'),
('competitor', 'Sobha', 'warning'),
('competitor', 'Nakheel', 'warning'),
('blocked_phrase', 'guaranteed returns', 'block'),
('blocked_phrase', 'risk-free investment', 'block'),
('blocked_phrase', 'get rich quick', 'block'),
('blocked_word', 'scam', 'escalate'),
('blocked_word', 'fraud', 'escalate');

-- ============================================
-- INSERT DEFAULT EMAIL TEMPLATES
-- ============================================
INSERT INTO public.broker_email_templates (name, subject, html_content, template_type, variables) VALUES
(
  'Welcome Email',
  'Welcome to JBJ Global Real Estate - Your Property Journey Starts Here',
  '<h1>Welcome, {{client_name}}!</h1><p>Thank you for your interest in Dubai real estate. I''m {{broker_name}}, your dedicated property consultant at JBJ Global Real Estate.</p><p>I''ll be helping you find the perfect property that matches your requirements. Feel free to reach out anytime at {{broker_email}} or call us at +971 56 591 1000.</p><p>Best regards,<br>{{broker_name}}<br>JBJ Global Real Estate</p>',
  'welcome',
  ARRAY['client_name', 'broker_name', 'broker_email']
),
(
  'Property Summary',
  '{{property_name}} - Property Details for Your Review',
  '<h1>Property Summary: {{property_name}}</h1><p>Dear {{client_name}},</p><p>As discussed, here are the details for {{property_name}}:</p><ul><li>Location: {{location}}</li><li>Price: {{price}}</li><li>Size: {{size}}</li><li>Bedrooms: {{bedrooms}}</li></ul><p>Please let me know if you would like to schedule a viewing.</p><p>Best regards,<br>{{broker_name}}</p>',
  'property_summary',
  ARRAY['client_name', 'broker_name', 'property_name', 'location', 'price', 'size', 'bedrooms']
);