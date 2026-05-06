ALTER TABLE public.meeting_requests
  ADD COLUMN IF NOT EXISTS attendees jsonb,
  ADD COLUMN IF NOT EXISTS consent_snapshot jsonb;