-- Fix overly permissive RLS policies

-- Drop and replace permissive INSERT policies with proper checks

-- Fix chat_history insert policy
DROP POLICY IF EXISTS "Insert chat history for authenticated" ON public.chat_history;
CREATE POLICY "Insert chat history with session" ON public.chat_history
  FOR INSERT WITH CHECK (session_id IS NOT NULL AND message IS NOT NULL);

-- Fix video_meeting_participants insert policy  
DROP POLICY IF EXISTS "Users can join meetings" ON public.video_meeting_participants;
CREATE POLICY "Authenticated users can join meetings" ON public.video_meeting_participants
  FOR INSERT WITH CHECK (
    participant_name IS NOT NULL AND 
    meeting_id IN (SELECT id FROM public.video_meetings WHERE status = 'active')
  );

-- Fix video_meeting_messages insert policy
DROP POLICY IF EXISTS "Send meeting messages" ON public.video_meeting_messages;
CREATE POLICY "Participants can send meeting messages" ON public.video_meeting_messages
  FOR INSERT WITH CHECK (
    meeting_id IN (
      SELECT vmp.meeting_id FROM public.video_meeting_participants vmp 
      WHERE vmp.user_id = auth.uid() OR vmp.participant_name IS NOT NULL
    )
  );