-- Create comprehensive chat and meeting history system

-- 1. Universal chat history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  session_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'ai_designer', 'mortgage_calculator', 'property_comparison', 'live_chat', 'ai_calendar', 'video_meet', 'founders_assistant'
  source_page TEXT,
  message TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user', 'assistant', 'system'
  metadata JSONB DEFAULT '{}',
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  flagged_by TEXT, -- 'ai_monitor', 'manual_review'
  flagged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Video meeting records
CREATE TABLE IF NOT EXISTS public.video_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL UNIQUE,
  host_user_id UUID REFERENCES auth.users(id),
  host_name TEXT,
  title TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'ended', 'terminated'
  is_recording BOOLEAN DEFAULT false,
  recording_url TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  end_reason TEXT, -- 'normal', 'host_terminated', 'timeout'
  termination_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Video meeting participants
CREATE TABLE IF NOT EXISTS public.video_meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  is_host BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  is_ai_broker BOOLEAN DEFAULT false,
  ai_broker_id UUID,
  role TEXT DEFAULT 'participant', -- 'host', 'admin', 'participant', 'guest'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  was_removed BOOLEAN DEFAULT false,
  removal_reason TEXT
);

-- 4. Video meeting chat messages
CREATE TABLE IF NOT EXISTS public.video_meeting_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.video_meeting_participants(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false, -- AI assistant invisible chat
  recipient_id UUID, -- For private messages
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. AI note-taking center
CREATE TABLE IF NOT EXISTS public.ai_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  source_type TEXT DEFAULT 'manual', -- 'manual', 'voice', 'meeting', 'pdf_extract', 'document_extract'
  source_url TEXT,
  ai_summary TEXT,
  ai_action_items JSONB DEFAULT '[]',
  ai_key_points JSONB DEFAULT '[]',
  ai_schedule JSONB DEFAULT '[]',
  tags TEXT[],
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Note projects/folders
CREATE TABLE IF NOT EXISTS public.note_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#A8925A',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Meeting AI notes (auto-generated during meetings)
CREATE TABLE IF NOT EXISTS public.meeting_ai_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  transcript TEXT,
  summary TEXT,
  action_items JSONB DEFAULT '[]',
  key_decisions JSONB DEFAULT '[]',
  client_details JSONB DEFAULT '{}', -- Budget, preferences, timeline
  property_suggestions JSONB DEFAULT '[]',
  follow_up_plan JSONB DEFAULT '{}',
  generated_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meeting_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_ai_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_history (admin can view all, users can view own)
CREATE POLICY "Users can view own chat history" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT bs.user_id FROM public.broker_subscriptions bs WHERE bs.user_role = 'founder'
  ));

CREATE POLICY "Insert chat history for authenticated" ON public.chat_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Founders can update chat flags" ON public.chat_history
  FOR UPDATE USING (auth.uid() IN (
    SELECT bs.user_id FROM public.broker_subscriptions bs WHERE bs.user_role = 'founder'
  ));

-- RLS Policies for video_meetings
CREATE POLICY "Users can view own meetings" ON public.video_meetings
  FOR SELECT USING (host_user_id = auth.uid() OR auth.uid() IN (
    SELECT vmp.user_id FROM public.video_meeting_participants vmp WHERE vmp.meeting_id = id
  ));

CREATE POLICY "Users can create meetings" ON public.video_meetings
  FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update meetings" ON public.video_meetings
  FOR UPDATE USING (host_user_id = auth.uid());

-- RLS Policies for participants
CREATE POLICY "Users can view meeting participants" ON public.video_meeting_participants
  FOR SELECT USING (user_id = auth.uid() OR meeting_id IN (
    SELECT vm.id FROM public.video_meetings vm WHERE vm.host_user_id = auth.uid()
  ));

CREATE POLICY "Users can join meetings" ON public.video_meeting_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Hosts can manage participants" ON public.video_meeting_participants
  FOR UPDATE USING (meeting_id IN (
    SELECT vm.id FROM public.video_meetings vm WHERE vm.host_user_id = auth.uid()
  ));

CREATE POLICY "Hosts can remove participants" ON public.video_meeting_participants
  FOR DELETE USING (meeting_id IN (
    SELECT vm.id FROM public.video_meetings vm WHERE vm.host_user_id = auth.uid()
  ));

-- RLS Policies for meeting messages
CREATE POLICY "View meeting messages" ON public.video_meeting_messages
  FOR SELECT USING (meeting_id IN (
    SELECT vmp.meeting_id FROM public.video_meeting_participants vmp WHERE vmp.user_id = auth.uid()
  ));

CREATE POLICY "Send meeting messages" ON public.video_meeting_messages
  FOR INSERT WITH CHECK (true);

-- RLS Policies for ai_notes
CREATE POLICY "Users can CRUD own notes" ON public.ai_notes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for note_projects
CREATE POLICY "Users can CRUD own projects" ON public.note_projects
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for meeting_ai_notes
CREATE POLICY "Users can view own meeting notes" ON public.meeting_ai_notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Insert meeting notes" ON public.meeting_ai_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_source ON public.chat_history(source);
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_flagged ON public.chat_history(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON public.chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_meetings_room ON public.video_meetings(room_id);
CREATE INDEX IF NOT EXISTS idx_video_meetings_host ON public.video_meetings(host_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_notes_user ON public.ai_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_notes_project ON public.ai_notes(project_id);

-- Enable realtime for meeting messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_meeting_messages;

-- Create updated_at trigger for ai_notes
CREATE OR REPLACE TRIGGER update_ai_notes_updated_at
BEFORE UPDATE ON public.ai_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_note_projects_updated_at
BEFORE UPDATE ON public.note_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();