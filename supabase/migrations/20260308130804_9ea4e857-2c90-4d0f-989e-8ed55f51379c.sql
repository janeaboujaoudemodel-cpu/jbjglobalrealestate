
CREATE TABLE public.meeting_session_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  broker_user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  session_type TEXT NOT NULL DEFAULT 'phone_call',
  consent_text TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  id_photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'signed',
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_session_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own consents" ON public.meeting_session_consents
  FOR INSERT TO authenticated WITH CHECK (broker_user_id = auth.uid());

CREATE POLICY "Users can view their own consents" ON public.meeting_session_consents
  FOR SELECT TO authenticated USING (broker_user_id = auth.uid());
