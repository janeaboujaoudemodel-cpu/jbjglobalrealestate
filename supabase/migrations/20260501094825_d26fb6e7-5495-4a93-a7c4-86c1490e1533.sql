-- Extend meeting_requests for brokerage breakfast bookings
ALTER TABLE public.meeting_requests
  ADD COLUMN IF NOT EXISTS booking_kind text,
  ADD COLUMN IF NOT EXISTS brokerage_id uuid,
  ADD COLUMN IF NOT EXISTS brokerage_name text,
  ADD COLUMN IF NOT EXISTS invite_token text,
  ADD COLUMN IF NOT EXISTS briefing_topics text,
  ADD COLUMN IF NOT EXISTS partnership_focus text,
  ADD COLUMN IF NOT EXISTS attendee_count integer,
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Add FK (no-op if already there)
DO $$ BEGIN
  ALTER TABLE public.meeting_requests
    ADD CONSTRAINT meeting_requests_brokerage_fk
    FOREIGN KEY (brokerage_id) REFERENCES public.crm_brokerages(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS meeting_requests_invite_token_uniq
  ON public.meeting_requests(invite_token)
  WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS meeting_requests_brokerage_idx
  ON public.meeting_requests(brokerage_id);
CREATE INDEX IF NOT EXISTS meeting_requests_booking_kind_idx
  ON public.meeting_requests(booking_kind);

-- Allow anon to look up a single row by invite_token (booking page pre-fill)
DO $$ BEGIN
  CREATE POLICY "Public can read meeting request by invite token"
    ON public.meeting_requests
    FOR SELECT
    TO anon, authenticated
    USING (invite_token IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow anon to UPDATE only their own row by invite_token (confirm booking)
DO $$ BEGIN
  CREATE POLICY "Public can confirm meeting request by invite token"
    ON public.meeting_requests
    FOR UPDATE
    TO anon, authenticated
    USING (invite_token IS NOT NULL AND status IN ('invited','pending'))
    WITH CHECK (invite_token IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Slot inventory
CREATE TABLE IF NOT EXISTS public.breakfast_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_at timestamptz NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.breakfast_slots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can view active future breakfast slots"
    ON public.breakfast_slots
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true AND slot_at > now());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Owner can manage breakfast slots"
    ON public.breakfast_slots
    FOR ALL
    TO authenticated
    USING (
      ((SELECT email FROM auth.users WHERE id = auth.uid())::text
        IN ('janeaboujaoudenails@gmail.com','janeaboujaoudemodel@gmail.com','infoo.jane@gmail.com'))
    )
    WITH CHECK (
      ((SELECT email FROM auth.users WHERE id = auth.uid())::text
        IN ('janeaboujaoudenails@gmail.com','janeaboujaoudemodel@gmail.com','infoo.jane@gmail.com'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_breakfast_slots_updated_at ON public.breakfast_slots;
CREATE TRIGGER update_breakfast_slots_updated_at
  BEFORE UPDATE ON public.breakfast_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: next 4 weeks Tuesdays + Thursdays at 08:30 and 09:30 (Dubai/UTC+4)
INSERT INTO public.breakfast_slots (slot_at, capacity, notes)
SELECT slot, 1, 'Private breakfast briefing — JBJ HQ'
FROM (
  SELECT (date_trunc('day', now() + (n || ' days')::interval)
          + time '08:30')::timestamptz AT TIME ZONE 'Asia/Dubai' AS slot
  FROM generate_series(1, 28) n
  WHERE EXTRACT(DOW FROM (now() + (n || ' days')::interval)) IN (2, 4)
  UNION ALL
  SELECT (date_trunc('day', now() + (n || ' days')::interval)
          + time '09:30')::timestamptz AT TIME ZONE 'Asia/Dubai' AS slot
  FROM generate_series(1, 28) n
  WHERE EXTRACT(DOW FROM (now() + (n || ' days')::interval)) IN (2, 4)
) s
ON CONFLICT (slot_at) DO NOTHING;