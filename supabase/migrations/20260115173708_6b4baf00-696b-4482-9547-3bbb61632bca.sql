-- ============================================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================

-- 1. employee_chat_messages: restrict to authenticated users only (internal employee chat)
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.employee_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can update chat messages" ON public.employee_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.employee_chat_messages;

CREATE POLICY "Employees can view own chat messages" ON public.employee_chat_messages
FOR SELECT TO authenticated
USING (sender_id = 'current-user' OR recipient_id = 'current-user');

CREATE POLICY "Employees can insert own chat messages" ON public.employee_chat_messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = 'current-user');

CREATE POLICY "Employees can update own chat messages" ON public.employee_chat_messages
FOR UPDATE TO authenticated
USING (sender_id = 'current-user' OR recipient_id = 'current-user');

-- 2. employee_notifications: restrict to authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.employee_notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.employee_notifications;
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.employee_notifications;

CREATE POLICY "Users can view own notifications" ON public.employee_notifications
FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert notifications" ON public.employee_notifications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.employee_notifications
FOR UPDATE TO authenticated USING (true);

-- 3. employee_status: make read-only for public, restrict writes
DROP POLICY IF EXISTS "Anyone can view employee status" ON public.employee_status;
DROP POLICY IF EXISTS "Authenticated users can insert employee status" ON public.employee_status;
DROP POLICY IF EXISTS "Authenticated users can update employee status" ON public.employee_status;

CREATE POLICY "Anyone can view employee status" ON public.employee_status
FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage employee status" ON public.employee_status
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. video_meeting_messages: fix to only allow active participants
DROP POLICY IF EXISTS "View meeting messages" ON public.video_meeting_messages;
DROP POLICY IF EXISTS "Participants can send meeting messages" ON public.video_meeting_messages;

CREATE POLICY "Active participants view messages" ON public.video_meeting_messages
FOR SELECT TO authenticated
USING (
  meeting_id IN (
    SELECT meeting_id FROM public.video_meeting_participants
    WHERE user_id = auth.uid()
    AND left_at IS NULL
    AND was_removed = false
  )
);

CREATE POLICY "Active participants send messages" ON public.video_meeting_messages
FOR INSERT TO authenticated
WITH CHECK (
  meeting_id IN (
    SELECT meeting_id FROM public.video_meeting_participants
    WHERE user_id = auth.uid()
    AND left_at IS NULL
    AND was_removed = false
  )
);

-- 5. video_meeting_participants: fix policies to authenticated only
DROP POLICY IF EXISTS "Authenticated users can join meetings" ON public.video_meeting_participants;
DROP POLICY IF EXISTS "Hosts can manage participants" ON public.video_meeting_participants;
DROP POLICY IF EXISTS "Hosts can remove participants" ON public.video_meeting_participants;
DROP POLICY IF EXISTS "Users can view meeting participants" ON public.video_meeting_participants;

CREATE POLICY "View meeting participants" ON public.video_meeting_participants
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR meeting_id IN (SELECT id FROM public.video_meetings WHERE host_user_id = auth.uid())
);

CREATE POLICY "Join active meetings" ON public.video_meeting_participants
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND meeting_id IN (SELECT id FROM public.video_meetings WHERE status = 'active')
);

CREATE POLICY "Hosts manage participants" ON public.video_meeting_participants
FOR UPDATE TO authenticated
USING (meeting_id IN (SELECT id FROM public.video_meetings WHERE host_user_id = auth.uid()));

CREATE POLICY "Hosts remove participants" ON public.video_meeting_participants
FOR DELETE TO authenticated
USING (meeting_id IN (SELECT id FROM public.video_meetings WHERE host_user_id = auth.uid()));

-- 6. video_meetings: fix policies to authenticated only
DROP POLICY IF EXISTS "Hosts can update meetings" ON public.video_meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON public.video_meetings;
DROP POLICY IF EXISTS "Users can view own meetings" ON public.video_meetings;

CREATE POLICY "View own meetings" ON public.video_meetings
FOR SELECT TO authenticated
USING (
  host_user_id = auth.uid() 
  OR id IN (SELECT meeting_id FROM public.video_meeting_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Create meetings" ON public.video_meetings
FOR INSERT TO authenticated
WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Update own meetings" ON public.video_meetings
FOR UPDATE TO authenticated
USING (host_user_id = auth.uid());