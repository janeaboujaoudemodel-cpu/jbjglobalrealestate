
-- 1. Schema additions to meeting_bookings
ALTER TABLE public.meeting_bookings
  ADD COLUMN IF NOT EXISTS nationality       text,
  ADD COLUMN IF NOT EXISTS website_url       text,
  ADD COLUMN IF NOT EXISTS social_links      jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachment_url    text,
  ADD COLUMN IF NOT EXISTS attachment_name   text,
  ADD COLUMN IF NOT EXISTS lead_id           uuid,
  ADD COLUMN IF NOT EXISTS calendar_event_id uuid;

-- 2. Update slot validation: Tue–Fri 11:00–17:00 Dubai, end must not pass 17:00
CREATE OR REPLACE FUNCTION public.validate_meeting_booking_slot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  dubai_start timestamp;
  dubai_end   timestamp;
  dow int;
  start_hr int;
  start_min int;
  end_hr int;
  end_min int;
  earliest_allowed timestamptz;
  dur int;
BEGIN
  dur := COALESCE(NEW.duration_min, 60);

  dubai_start := (NEW.booked_for_at AT TIME ZONE 'Asia/Dubai');
  dubai_end   := dubai_start + make_interval(mins => dur);
  dow         := EXTRACT(ISODOW FROM dubai_start);  -- 1=Mon..7=Sun
  start_hr    := EXTRACT(HOUR   FROM dubai_start);
  start_min   := EXTRACT(MINUTE FROM dubai_start);
  end_hr      := EXTRACT(HOUR   FROM dubai_end);
  end_min     := EXTRACT(MINUTE FROM dubai_end);

  IF dow NOT BETWEEN 2 AND 5 THEN
    RAISE EXCEPTION 'Meetings are available Tuesday through Friday (Dubai time).';
  END IF;

  IF start_hr < 11 OR (start_hr * 60 + start_min) < 11 * 60 THEN
    RAISE EXCEPTION 'Meetings must start at or after 11:00 Dubai time.';
  END IF;

  IF (end_hr * 60 + end_min) > 17 * 60 THEN
    RAISE EXCEPTION 'Meetings must end by 17:00 Dubai time. Please choose an earlier slot or a shorter duration.';
  END IF;

  earliest_allowed := ((date_trunc('day', (now() AT TIME ZONE 'Asia/Dubai')) + interval '1 day') AT TIME ZONE 'Asia/Dubai');
  IF NEW.booked_for_at < earliest_allowed THEN
    RAISE EXCEPTION 'Meeting bookings must be made at least one day in advance.';
  END IF;

  IF NEW.location_type = 'online' AND NEW.online_platform IS NULL THEN
    RAISE EXCEPTION 'Online meetings require an online_platform (zoom or google_meet).';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 3. Storage bucket for optional company profile uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-booking-attachments',
  'meeting-booking-attachments',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit  = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    public = false;

-- Storage policies
DROP POLICY IF EXISTS "Public can upload meeting booking attachments"
  ON storage.objects;
CREATE POLICY "Public can upload meeting booking attachments"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'meeting-booking-attachments');

DROP POLICY IF EXISTS "Owners read meeting booking attachments"
  ON storage.objects;
CREATE POLICY "Owners read meeting booking attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'meeting-booking-attachments'
    AND public.has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS "Owners manage meeting booking attachments"
  ON storage.objects;
CREATE POLICY "Owners manage meeting booking attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'meeting-booking-attachments'
    AND public.has_role(auth.uid(), 'owner'::app_role)
  );
