
-- Meeting Requests table for Amanda meeting booking system
CREATE TABLE public.meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  purpose TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_notes TEXT,
  rescheduled_date DATE,
  rescheduled_time TEXT,
  video_meet_link TEXT,
  meeting_summary TEXT,
  calendar_event_id TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID
);

-- Enable RLS
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

-- Owner can see all meeting requests
CREATE POLICY "Owner can manage all meeting requests"
  ON public.meeting_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public users can insert meeting requests
CREATE POLICY "Anyone can submit meeting requests"
  ON public.meeting_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Email signatures table
CREATE TABLE public.email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id TEXT NOT NULL,
  identity_name TEXT NOT NULL,
  signature_html TEXT,
  signature_text TEXT,
  stamp_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID
);

ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage email signatures"
  ON public.email_signatures
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
