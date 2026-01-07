
-- Executive Assistant Command Center Tables

-- Communication channels enum
CREATE TYPE public.comm_channel AS ENUM ('email', 'whatsapp', 'instagram', 'facebook', 'linkedin', 'phone', 'sms');

-- Communication priority/category
CREATE TYPE public.comm_category AS ENUM ('important', 'routine', 'recruitment', 'flagged', 'spam');

-- AI action status
CREATE TYPE public.ai_action_status AS ENUM ('pending', 'auto_responded', 'flagged_for_review', 'human_responded', 'ignored');

-- Main communications inbox
CREATE TABLE public.assistant_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel comm_channel NOT NULL,
  category comm_category NOT NULL DEFAULT 'flagged',
  sender_name TEXT,
  sender_identifier TEXT NOT NULL, -- email, phone, social handle
  subject TEXT,
  content TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_status ai_action_status NOT NULL DEFAULT 'pending',
  ai_response TEXT,
  ai_confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  ai_reasoning TEXT, -- Why AI made this decision
  human_response TEXT,
  human_reviewed_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Learning/Training responses
CREATE TABLE public.assistant_learned_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trigger_keywords TEXT[] NOT NULL, -- Keywords that trigger this response
  trigger_category comm_category,
  trigger_channel comm_channel,
  response_template TEXT NOT NULL,
  is_auto_respond BOOLEAN DEFAULT false, -- If true, AI responds automatically
  priority INTEGER DEFAULT 0, -- Higher = checked first
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ignore rules (what to filter out)
CREATE TABLE public.assistant_ignore_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'keyword', 'sender', 'domain', 'subject_pattern'
  rule_value TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'archive', -- 'archive', 'delete', 'move_to_category'
  target_category comm_category,
  is_active BOOLEAN DEFAULT true,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contacts database for AI context
CREATE TABLE public.assistant_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  linkedin TEXT,
  facebook TEXT,
  company TEXT,
  role TEXT,
  relationship TEXT, -- 'broker', 'agent', 'client', 'vendor', 'lead'
  importance_level INTEGER DEFAULT 5, -- 1-10, 10 = most important
  notes TEXT,
  ai_summary TEXT, -- AI-generated summary of relationship
  last_contact_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tasks assigned by AI or user
CREATE TABLE public.assistant_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assigned_to_contact_id UUID REFERENCES public.assistant_contacts(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date TIMESTAMP WITH TIME ZONE,
  source_communication_id UUID REFERENCES public.assistant_communications(id),
  ai_created BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI decision log for transparency
CREATE TABLE public.assistant_ai_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  communication_id UUID REFERENCES public.assistant_communications(id),
  action_taken TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence_score NUMERIC(3,2),
  learned_response_id UUID REFERENCES public.assistant_learned_responses(id),
  was_correct BOOLEAN, -- User feedback
  correction_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Channel integrations config
CREATE TABLE public.assistant_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel comm_channel NOT NULL,
  is_active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}', -- Encrypted config stored here
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'not_configured',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel)
);

-- Enable RLS
ALTER TABLE public.assistant_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_learned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_ignore_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users view own communications" ON public.assistant_communications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own learned responses" ON public.assistant_learned_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ignore rules" ON public.assistant_ignore_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own contacts" ON public.assistant_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tasks" ON public.assistant_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own AI logs" ON public.assistant_ai_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own integrations" ON public.assistant_integrations FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_communications_user_category ON public.assistant_communications(user_id, category);
CREATE INDEX idx_communications_user_status ON public.assistant_communications(user_id, ai_status);
CREATE INDEX idx_communications_received ON public.assistant_communications(received_at DESC);
CREATE INDEX idx_learned_responses_keywords ON public.assistant_learned_responses USING GIN(trigger_keywords);
CREATE INDEX idx_contacts_user ON public.assistant_contacts(user_id);
CREATE INDEX idx_tasks_user_status ON public.assistant_tasks(user_id, status);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_assistant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_communications_timestamp BEFORE UPDATE ON public.assistant_communications FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();
CREATE TRIGGER update_learned_responses_timestamp BEFORE UPDATE ON public.assistant_learned_responses FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();
CREATE TRIGGER update_contacts_timestamp BEFORE UPDATE ON public.assistant_contacts FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON public.assistant_tasks FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();
CREATE TRIGGER update_integrations_timestamp BEFORE UPDATE ON public.assistant_integrations FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();
