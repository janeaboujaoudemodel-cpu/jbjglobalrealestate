-- 1) broker_email_oauth_apps: explicit owner-scoped SELECT policy (defense-in-depth)
DROP POLICY IF EXISTS owner_select_own_oauth_app ON public.broker_email_oauth_apps;
CREATE POLICY owner_select_own_oauth_app
  ON public.broker_email_oauth_apps FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2) crm_chat_messages: require actual channel membership
CREATE TABLE IF NOT EXISTS public.crm_chat_channel_participants (
  channel_id text NOT NULL,
  user_id uuid NOT NULL,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.crm_chat_channel_participants TO authenticated;
GRANT ALL ON public.crm_chat_channel_participants TO service_role;

ALTER TABLE public.crm_chat_channel_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_read_own" ON public.crm_chat_channel_participants;
CREATE POLICY "participants_read_own"
  ON public.crm_chat_channel_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "participants_self_join" ON public.crm_chat_channel_participants;
CREATE POLICY "participants_self_join"
  ON public.crm_chat_channel_participants FOR INSERT
  TO authenticated
  WITH CHECK (added_by = auth.uid());

DROP POLICY IF EXISTS "participants_self_leave" ON public.crm_chat_channel_participants;
CREATE POLICY "participants_self_leave"
  ON public.crm_chat_channel_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Backfill participants from historical senders so existing conversations remain accessible
INSERT INTO public.crm_chat_channel_participants (channel_id, user_id)
SELECT DISTINCT cm.channel_id, cm.sender_id::uuid
FROM public.crm_chat_messages cm
WHERE cm.sender_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "crm_chat_participants_read" ON public.crm_chat_messages;
CREATE POLICY "crm_chat_participants_read"
  ON public.crm_chat_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.crm_chat_channel_participants p
      WHERE p.channel_id = crm_chat_messages.channel_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3) meeting-booking-attachments: require valid booking token in path
DROP POLICY IF EXISTS "Public uploads scoped to bookings folder" ON storage.objects;
CREATE POLICY "Booking-token scoped uploads to bookings folder"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'meeting-booking-attachments'
    AND (storage.foldername(name))[1] = 'bookings'
    AND (storage.foldername(name))[2] IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.meeting_booking_tokens t
      WHERE t.token = (storage.foldername(name))[2]
    )
    AND lower(substring(name FROM '\.([^\.]+)$')) IN
      ('pdf','jpg','jpeg','png','webp','doc','docx','xls','xlsx','ppt','pptx','txt','csv')
  );