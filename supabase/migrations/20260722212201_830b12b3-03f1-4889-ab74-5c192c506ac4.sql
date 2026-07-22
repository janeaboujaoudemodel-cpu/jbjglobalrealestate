ALTER TABLE public.crm_owner_settings
  ADD COLUMN IF NOT EXISTS google_calendar_booking_url_business text,
  ADD COLUMN IF NOT EXISTS google_calendar_booking_url_personal text,
  ADD COLUMN IF NOT EXISTS google_calendar_active_account text NOT NULL DEFAULT 'personal';

-- Backfill: if a single URL was previously saved, treat it as the personal one.
UPDATE public.crm_owner_settings
   SET google_calendar_booking_url_personal = google_calendar_booking_url
 WHERE google_calendar_booking_url_personal IS NULL
   AND google_calendar_booking_url IS NOT NULL;