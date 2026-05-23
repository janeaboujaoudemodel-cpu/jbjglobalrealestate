
-- 1. CRM lead account status
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'form_only';

-- 2. Meeting booking columns
ALTER TABLE public.meeting_bookings
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS location_link text,
  ADD COLUMN IF NOT EXISTS location_label text,
  ADD COLUMN IF NOT EXISTS cancel_deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_meeting_bookings_auth_user_id
  ON public.meeting_bookings(auth_user_id);

-- 3. Trigger: compute cancel_deadline_at from booked_for_at
CREATE OR REPLACE FUNCTION public.compute_meeting_cancel_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dubai_hour int;
BEGIN
  IF NEW.booked_for_at IS NULL THEN
    RETURN NEW;
  END IF;
  dubai_hour := EXTRACT(HOUR FROM (NEW.booked_for_at AT TIME ZONE 'Asia/Dubai'));
  IF dubai_hour >= 14 THEN
    NEW.cancel_deadline_at := NEW.booked_for_at - interval '6 hours';
  ELSE
    NEW.cancel_deadline_at := NEW.booked_for_at - interval '24 hours';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meeting_cancel_deadline ON public.meeting_bookings;
CREATE TRIGGER trg_meeting_cancel_deadline
  BEFORE INSERT OR UPDATE OF booked_for_at, reschedule_proposed_for
  ON public.meeting_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_meeting_cancel_deadline();

-- Backfill existing rows
UPDATE public.meeting_bookings
SET booked_for_at = booked_for_at
WHERE cancel_deadline_at IS NULL;
