-- ============================================================================
-- JBJ Owner AI Communications OS - Complete Database Schema
-- ============================================================================

-- ENUM TYPES
CREATE TYPE comm_assistant_type AS ENUM ('owner', 'company');
CREATE TYPE comm_message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE comm_thread_status AS ENUM ('new', 'needs_reply', 'waiting', 'follow_up_due', 'closed');

-- ============================================================================
-- 1. COMMUNICATION CHANNELS (Multi-account support)
-- ============================================================================
CREATE TABLE owner_comm_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'email_gmail', 'email_hostinger', 'instagram', 'facebook', 'website_chat', 'voice')),
  assistant_type comm_assistant_type NOT NULL DEFAULT 'company',
  display_name TEXT NOT NULL,
  identifier TEXT NOT NULL, -- phone number, email address, etc.
  credentials JSONB DEFAULT '{}'::jsonb, -- encrypted OAuth tokens, IMAP settings, etc.
  settings JSONB DEFAULT '{}'::jsonb, -- auto_send, voice_enabled, signature, disclosure
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_channels_owner_policy" ON owner_comm_channels
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. UNIFIED CONVERSATION THREADS
-- ============================================================================
CREATE TABLE owner_comm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_id UUID REFERENCES owner_comm_channels(id) ON DELETE SET NULL,
  channel_type TEXT NOT NULL,
  assistant_type comm_assistant_type NOT NULL DEFAULT 'company',
  contact_name TEXT,
  contact_identifier TEXT NOT NULL, -- phone, email, handle
  contact_avatar_url TEXT,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  status comm_thread_status NOT NULL DEFAULT 'new',
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb, -- external thread IDs, labels, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_threads_owner_policy" ON owner_comm_threads
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_owner_comm_threads_status ON owner_comm_threads(status);
CREATE INDEX idx_owner_comm_threads_channel ON owner_comm_threads(channel_type);
CREATE INDEX idx_owner_comm_threads_lead ON owner_comm_threads(lead_id);
CREATE INDEX idx_owner_comm_threads_last_message ON owner_comm_threads(last_message_at DESC);

-- ============================================================================
-- 3. MESSAGES
-- ============================================================================
CREATE TABLE owner_comm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES owner_comm_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  direction comm_message_direction NOT NULL,
  sender_name TEXT,
  sender_identifier TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- text, voice, image, file
  voice_url TEXT, -- ElevenLabs generated voice note URL
  voice_duration_seconds INTEGER,
  attachments JSONB DEFAULT '[]'::jsonb,
  external_message_id TEXT, -- WhatsApp message ID, email message ID, etc.
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  ai_template_id UUID,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_messages_owner_policy" ON owner_comm_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_owner_comm_messages_thread ON owner_comm_messages(thread_id);
CREATE INDEX idx_owner_comm_messages_created ON owner_comm_messages(created_at DESC);

-- ============================================================================
-- 4. MESSAGE TEMPLATES
-- ============================================================================
CREATE TABLE owner_comm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('new_lead', 'no_reply', 'follow_up', 'viewing', 'offer', 'closing', 'nurture', 'support', 'custom')),
  channel_types TEXT[] NOT NULL DEFAULT ARRAY['whatsapp', 'email', 'instagram', 'facebook'],
  subject TEXT, -- for email templates
  content TEXT NOT NULL,
  voice_script TEXT, -- for voice generation
  variables JSONB DEFAULT '["lead_name", "property_name", "price", "location", "handover", "whatsapp_link", "calendar_link"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_templates_owner_policy" ON owner_comm_templates
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_owner_comm_templates_category ON owner_comm_templates(category);

-- ============================================================================
-- 5. AI REPLY DRAFTS (Draft before sending)
-- ============================================================================
CREATE TABLE owner_comm_ai_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES owner_comm_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  draft_type TEXT NOT NULL CHECK (draft_type IN ('text', 'email', 'voice')),
  subject TEXT, -- for email
  content TEXT NOT NULL,
  voice_script TEXT,
  voice_url TEXT,
  template_id UUID REFERENCES owner_comm_templates(id) ON DELETE SET NULL,
  ai_model_used TEXT,
  ai_confidence REAL,
  ai_reasoning TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  sent_message_id UUID REFERENCES owner_comm_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_ai_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_ai_drafts_owner_policy" ON owner_comm_ai_drafts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 6. AI LEARNING (Tone, corrections, preferences)
-- ============================================================================
CREATE TABLE owner_comm_ai_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  learning_type TEXT NOT NULL CHECK (learning_type IN ('tone_example', 'correction', 'preference', 'keyword')),
  original_content TEXT,
  corrected_content TEXT,
  context TEXT,
  tags TEXT[],
  importance_score REAL DEFAULT 0.5,
  applied_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_ai_learning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_ai_learning_owner_policy" ON owner_comm_ai_learning
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. AI TONE PROFILES
-- ============================================================================
CREATE TABLE owner_comm_tone_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_name TEXT NOT NULL DEFAULT 'default',
  assistant_type comm_assistant_type NOT NULL DEFAULT 'owner',
  formality_level INTEGER DEFAULT 3 CHECK (formality_level BETWEEN 1 AND 5), -- 1=casual, 5=formal
  emoji_usage INTEGER DEFAULT 2 CHECK (emoji_usage BETWEEN 0 AND 5), -- 0=never, 5=frequent
  message_length TEXT DEFAULT 'medium' CHECK (message_length IN ('short', 'medium', 'long')),
  language_switching BOOLEAN DEFAULT true,
  preferred_languages TEXT[] DEFAULT ARRAY['en', 'ar'],
  signature TEXT,
  disclosure_text TEXT,
  sample_messages TEXT[], -- Examples of owner's writing style
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_name)
);

ALTER TABLE owner_comm_tone_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_tone_profiles_owner_policy" ON owner_comm_tone_profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 8. COMMUNICATION TASKS/REMINDERS (Follow-up detection)
-- ============================================================================
CREATE TABLE owner_comm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  thread_id UUID REFERENCES owner_comm_threads(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'follow_up' CHECK (task_type IN ('follow_up', 'call', 'meeting', 'send_info', 'review', 'custom')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_at TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  is_ai_suggested BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_tasks_owner_policy" ON owner_comm_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_owner_comm_tasks_due ON owner_comm_tasks(due_at) WHERE NOT is_completed;
CREATE INDEX idx_owner_comm_tasks_lead ON owner_comm_tasks(lead_id);

-- ============================================================================
-- 9. VOICE GENERATION LOG (ElevenLabs)
-- ============================================================================
CREATE TABLE owner_comm_voice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  thread_id UUID REFERENCES owner_comm_threads(id) ON DELETE SET NULL,
  message_id UUID REFERENCES owner_comm_messages(id) ON DELETE SET NULL,
  voice_id TEXT NOT NULL, -- ElevenLabs voice ID
  script TEXT NOT NULL,
  audio_url TEXT,
  duration_seconds INTEGER,
  characters_used INTEGER,
  generation_time_ms INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_voice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_voice_logs_owner_policy" ON owner_comm_voice_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 10. COMMUNICATION SETTINGS (Per-user)
-- ============================================================================
CREATE TABLE owner_comm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  auto_send_enabled BOOLEAN DEFAULT false,
  voice_enabled BOOLEAN DEFAULT true,
  default_assistant_type comm_assistant_type DEFAULT 'company',
  auto_link_leads BOOLEAN DEFAULT true,
  auto_log_to_crm BOOLEAN DEFAULT true,
  ai_draft_by_default BOOLEAN DEFAULT true,
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "sound": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_comm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_comm_settings_owner_policy" ON owner_comm_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_owner_comm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_owner_comm_channels_updated
  BEFORE UPDATE ON owner_comm_channels
  FOR EACH ROW EXECUTE FUNCTION update_owner_comm_updated_at();

CREATE TRIGGER trg_owner_comm_threads_updated
  BEFORE UPDATE ON owner_comm_threads
  FOR EACH ROW EXECUTE FUNCTION update_owner_comm_updated_at();

CREATE TRIGGER trg_owner_comm_templates_updated
  BEFORE UPDATE ON owner_comm_templates
  FOR EACH ROW EXECUTE FUNCTION update_owner_comm_updated_at();

CREATE TRIGGER trg_owner_comm_ai_drafts_updated
  BEFORE UPDATE ON owner_comm_ai_drafts
  FOR EACH ROW EXECUTE FUNCTION update_owner_comm_updated_at();

CREATE TRIGGER trg_owner_comm_tone_profiles_updated
  BEFORE UPDATE ON owner_comm_tone_profiles
  FOR EACH ROW EXECUTE FUNCTION update_owner_comm_updated_at();

CREATE TRIGGER trg_owner_comm_tasks_updated
  BEFORE UPDATE ON owner_comm_tasks
  FOR EACH ROW EXECUTE FUNCTION update_owner_comm_updated_at();

CREATE TRIGGER trg_owner_comm_settings_updated
  BEFORE UPDATE ON owner_comm_settings
  FOR EACH ROW EXECUTE FUNCTION update_owner_comm_updated_at();

-- ============================================================================
-- Enable Realtime for threads and messages
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE owner_comm_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE owner_comm_messages;