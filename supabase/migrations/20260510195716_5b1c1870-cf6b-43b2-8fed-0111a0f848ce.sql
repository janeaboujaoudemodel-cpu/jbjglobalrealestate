-- ============================================================
-- Meeting booking system
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meeting_booking_tokens (
  token text PRIMARY KEY,
  created_by uuid NOT NULL,
  contact_name text,
  contact_email text,
  contact_company text,
  default_language text DEFAULT 'en',
  default_location_type text DEFAULT 'office',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_booking_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can create booking tokens"
  ON public.meeting_booking_tokens FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) AND created_by = auth.uid());

CREATE POLICY "Owners can view booking tokens"
  ON public.meeting_booking_tokens FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Anyone can look up a token to prefill the form"
  ON public.meeting_booking_tokens FOR SELECT
  TO anon
  USING (expires_at > now() AND consumed_at IS NULL);

CREATE POLICY "Owners can update booking tokens"
  ON public.meeting_booking_tokens FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- ============================================================

CREATE TABLE IF NOT EXISTS public.meeting_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  booked_for_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 60,

  visitor_name text NOT NULL,
  visitor_email text NOT NULL,
  visitor_phone text,
  visitor_company text,

  language text DEFAULT 'en',
  location_type text NOT NULL DEFAULT 'office' CHECK (location_type IN ('office','online')),
  online_platform text CHECK (online_platform IN ('zoom','google_meet')),
  meeting_url text,
  office_address text,
  notes text,

  source text NOT NULL DEFAULT 'public_landing'
    CHECK (source IN ('public_landing','branded_email','breakfast_outreach','manual')),
  ref_token text REFERENCES public.meeting_booking_tokens(token) ON DELETE SET NULL,

  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','cancelled','completed','no_show')),
  owner_confirmed_at timestamptz,

  meeting_request_id uuid REFERENCES public.meeting_requests(id) ON DELETE SET NULL,
  visitor_confirmation_sent_at timestamptz,
  owner_confirmation_sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS meeting_bookings_booked_for_at_idx ON public.meeting_bookings (booked_for_at);
CREATE INDEX IF NOT EXISTS meeting_bookings_email_idx ON public.meeting_bookings (visitor_email);
CREATE INDEX IF NOT EXISTS meeting_bookings_status_idx ON public.meeting_bookings (status);
CREATE INDEX IF NOT EXISTS meeting_bookings_ref_token_idx ON public.meeting_bookings (ref_token);

ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit bookings"
  ON public.meeting_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can view all bookings"
  ON public.meeting_bookings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update bookings"
  ON public.meeting_bookings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete bookings"
  ON public.meeting_bookings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- Validation trigger: enforce Mon–Fri 10:00–17:00 Dubai time, ≥1 day in advance
CREATE OR REPLACE FUNCTION public.validate_meeting_booking_slot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  dubai_ts timestamp;
  dow int;
  hr int;
  earliest_allowed timestamptz;
BEGIN
  -- Convert to Dubai local time for weekday/hour checks
  dubai_ts := (NEW.booked_for_at AT TIME ZONE 'Asia/Dubai');
  dow := EXTRACT(ISODOW FROM dubai_ts); -- 1=Mon..7=Sun
  hr := EXTRACT(HOUR FROM dubai_ts);

  IF dow NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Meeting bookings are only allowed Monday through Friday (Dubai time).';
  END IF;

  IF hr < 10 OR hr >= 17 THEN
    RAISE EXCEPTION 'Meeting bookings must start between 10:00 and 17:00 Dubai time.';
  END IF;

  -- ≥1 day in advance: cannot be earlier than tomorrow 00:00 Dubai time
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

DROP TRIGGER IF EXISTS validate_meeting_booking_slot_trg ON public.meeting_bookings;
CREATE TRIGGER validate_meeting_booking_slot_trg
  BEFORE INSERT OR UPDATE ON public.meeting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_meeting_booking_slot();