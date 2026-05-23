-- Drop the old status check first
ALTER TABLE public.meeting_bookings DROP CONSTRAINT IF EXISTS meeting_bookings_status_check;

-- Normalize legacy
UPDATE public.meeting_bookings SET status = 'approved' WHERE status = 'scheduled';
UPDATE public.meeting_bookings SET status = 'declined' WHERE status IN ('cancelled','no_show');
UPDATE public.meeting_bookings SET status = 'approved' WHERE status = 'completed';

ALTER TABLE public.meeting_bookings
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS meeting_topic text,
  ADD COLUMN IF NOT EXISTS proposal_text text,
  ADD COLUMN IF NOT EXISTS phone_country_code text,
  ADD COLUMN IF NOT EXISTS phone_national text,
  ADD COLUMN IF NOT EXISTS owner_action_token text,
  ADD COLUMN IF NOT EXISTS owner_response_message text,
  ADD COLUMN IF NOT EXISTS owner_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS reschedule_proposed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reschedule_proposed_for timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_bookings_action_token
  ON public.meeting_bookings(owner_action_token)
  WHERE owner_action_token IS NOT NULL;

ALTER TABLE public.meeting_bookings ALTER COLUMN status SET DEFAULT 'received';

ALTER TABLE public.meeting_bookings
  ADD CONSTRAINT meeting_bookings_status_chk
  CHECK (status IN ('received','pending','approved','declined','rescheduled'));

ALTER TABLE public.meeting_bookings DROP CONSTRAINT IF EXISTS meeting_bookings_service_type_chk;
ALTER TABLE public.meeting_bookings
  ADD CONSTRAINT meeting_bookings_service_type_chk
  CHECK (service_type IS NULL OR service_type IN (
    'general_inquiry','general_meeting','partnership',
    'investment_briefing','off_market_access','other'
  ));

CREATE INDEX IF NOT EXISTS idx_meeting_bookings_status_when
  ON public.meeting_bookings(status, booked_for_at);