-- Create comprehensive training samples for the Executive AI
-- These will be populated via the edge function for the authenticated user

-- Add sample learned responses for common scenarios
-- First, let's create a function to help seed initial data

-- Create executive_response_templates table for pre-built responses
CREATE TABLE IF NOT EXISTS public.executive_response_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  trigger_patterns TEXT[] NOT NULL DEFAULT '{}',
  response_template TEXT NOT NULL,
  tone TEXT DEFAULT 'professional',
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.executive_response_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing templates (accessible to authenticated users)
CREATE POLICY "Authenticated users can view response templates"
  ON public.executive_response_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insert pre-built response templates
INSERT INTO public.executive_response_templates (category, trigger_patterns, response_template, tone, priority) VALUES
-- Meeting & Scheduling
('scheduling', ARRAY['meeting', 'schedule', 'calendar', 'book', 'appointment'], 
'I''d be happy to help schedule that. Let me check the calendar and coordinate with the relevant team. I''ll have 2-3 optimal time slots ready for your review within the hour.', 'professional', 10),

('scheduling', ARRAY['reschedule', 'postpone', 'move', 'change time'], 
'I understand you need to adjust the timing. I''ll reach out to all parties involved and propose alternative slots. You''ll receive a confirmation once everyone agrees.', 'understanding', 9),

-- Client Communication
('client', ARRAY['client inquiry', 'property question', 'interested buyer', 'viewing request'], 
'Thank you for reaching out! I''ve noted your inquiry and our team will prepare a comprehensive response. Expect detailed information within 2 hours, or feel free to call us at +971 56 591 1000.', 'warm-professional', 10),

('client', ARRAY['complaint', 'issue', 'problem', 'unhappy', 'disappointed'], 
'I sincerely apologize for any inconvenience. This is being escalated to our leadership team immediately. We take all feedback seriously and will personally ensure this is resolved within 24 hours. May I call you to discuss?', 'empathetic', 10),

-- Broker Communication
('broker', ARRAY['commission', 'payment', 'broker fee', 'payout'], 
'I''ve forwarded your commission inquiry to our Finance department. You can expect a detailed breakdown within 24 hours. For urgent matters, please contact our finance team directly.', 'professional', 8),

('broker', ARRAY['listing', 'new property', 'project launch', 'exclusive'], 
'Excellent! I''ve noted this new listing opportunity. Our acquisition team will review and get back to you within 48 hours with our interest level and next steps.', 'enthusiastic', 8),

-- Financial
('finance', ARRAY['invoice', 'payment reminder', 'due', 'outstanding'], 
'Thank you for the reminder. I''ve flagged this for immediate review by our accounts team. Payment will be processed within the standard timeline unless there are queries.', 'professional', 9),

('finance', ARRAY['budget', 'expense', 'cost', 'spending'], 
'I''ve logged this expense inquiry. Our Finance AI will prepare a detailed analysis including categorization, comparisons, and optimization suggestions. Report ready within 1 hour.', 'efficient', 8),

-- Marketing
('marketing', ARRAY['campaign', 'promotion', 'advertisement', 'social media'], 
'Great initiative! I''ve coordinated with Marketing AI to assess this opportunity. Expect a strategic recommendation with creative concepts within 24 hours.', 'enthusiastic', 7),

-- Recruitment / HR
('recruitment', ARRAY['job application', 'cv', 'resume', 'position', 'vacancy', 'hiring'], 
'Thank you for your interest in joining JBJ Global. Your application has been received and forwarded to our HR team. You''ll hear back within 5 business days regarding next steps.', 'warm-professional', 6),

('recruitment', ARRAY['interview', 'assessment', 'onboarding'], 
'I''ve noted your inquiry about the interview/onboarding process. Our HR team, specifically Jessica, will reach out with detailed scheduling within 24 hours.', 'professional', 7),

-- General
('general', ARRAY['thank you', 'thanks', 'appreciate'], 
'You''re most welcome! It''s my pleasure to assist. Please don''t hesitate to reach out if there''s anything else I can help with.', 'warm', 5),

('general', ARRAY['urgent', 'asap', 'immediately', 'emergency'], 
'I understand the urgency. This has been marked as high priority and escalated immediately. You can expect a response within 30 minutes, or call us directly at +971 56 591 1000.', 'urgent-professional', 10);

-- Create executive_automation_rules table
CREATE TABLE IF NOT EXISTS public.executive_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'auto_respond', 'categorize', 'forward', 'schedule_followup', 'notify'
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.executive_automation_rules ENABLE ROW LEVEL SECURITY;

-- Owner-only access
CREATE POLICY "Users can manage their own automation rules"
  ON public.executive_automation_rules
  FOR ALL
  USING (auth.uid() = user_id);

-- Create executive_integrations table for connected services
CREATE TABLE IF NOT EXISTS public.executive_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL, -- 'whatsapp', 'email', 'instagram', 'calendar', 'banking'
  service_type TEXT NOT NULL, -- 'communication', 'finance', 'scheduling', 'social'
  credentials_encrypted TEXT, -- Encrypted credentials
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_name)
);

-- Enable RLS
ALTER TABLE public.executive_integrations ENABLE ROW LEVEL SECURITY;

-- Owner-only access
CREATE POLICY "Users can manage their own integrations"
  ON public.executive_integrations
  FOR ALL
  USING (auth.uid() = user_id);

-- Create executive_knowledge_base for AI learning
CREATE TABLE IF NOT EXISTS public.executive_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'company_info', 'policies', 'contacts', 'processes', 'faq'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  importance_score INTEGER DEFAULT 5,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.executive_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Owner-only access
CREATE POLICY "Users can manage their own knowledge base"
  ON public.executive_knowledge_base
  FOR ALL
  USING (auth.uid() = user_id);

-- Create executive_conversation_memory for persistent memory
CREATE TABLE IF NOT EXISTS public.executive_conversation_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL, -- 'preference', 'fact', 'instruction', 'relationship'
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  source TEXT, -- 'conversation', 'manual', 'learned'
  last_referenced_at TIMESTAMP WITH TIME ZONE,
  reference_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, memory_type, memory_key)
);

-- Enable RLS
ALTER TABLE public.executive_conversation_memory ENABLE ROW LEVEL SECURITY;

-- Owner-only access
CREATE POLICY "Users can manage their own conversation memory"
  ON public.executive_conversation_memory
  FOR ALL
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exec_templates_category ON public.executive_response_templates(category);
CREATE INDEX IF NOT EXISTS idx_exec_automation_user ON public.executive_automation_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_exec_integrations_user ON public.executive_integrations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_exec_knowledge_user ON public.executive_knowledge_base(user_id, category);
CREATE INDEX IF NOT EXISTS idx_exec_memory_user ON public.executive_conversation_memory(user_id, memory_type);