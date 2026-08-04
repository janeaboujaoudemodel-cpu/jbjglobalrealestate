DROP POLICY IF EXISTS "participants_self_join" ON public.crm_chat_channel_participants;
CREATE POLICY "channel_members_invite_participants"
ON public.crm_chat_channel_participants
FOR INSERT TO authenticated
WITH CHECK (
  added_by = auth.uid()
  AND user_id IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.crm_chat_channel_participants existing
      WHERE existing.channel_id = crm_chat_channel_participants.channel_id
        AND existing.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "crm_chat_messages_insert" ON public.crm_chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages" ON public.crm_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.crm_chat_messages;
CREATE POLICY "channel_participants_send_messages"
ON public.crm_chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.crm_chat_channel_participants participant
    WHERE participant.channel_id = crm_chat_messages.channel_id
      AND participant.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join active meetings" ON public.video_meeting_participants;
DROP POLICY IF EXISTS "Authenticated users can join meetings" ON public.video_meeting_participants;
DROP POLICY IF EXISTS "Users can join meetings" ON public.video_meeting_participants;
CREATE POLICY "meeting_hosts_add_participants"
ON public.video_meeting_participants
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.video_meetings meeting
    WHERE meeting.id = video_meeting_participants.meeting_id
      AND meeting.host_user_id = auth.uid()
      AND meeting.status IN ('scheduled', 'active')
  )
);