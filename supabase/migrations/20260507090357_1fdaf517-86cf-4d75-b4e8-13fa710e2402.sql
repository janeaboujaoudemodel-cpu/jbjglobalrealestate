
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS attended_breakfast boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS breakfast_date date,
  ADD COLUMN IF NOT EXISTS breakfast_attendee_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS briefing_attendee_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attendee_notes text;

UPDATE public.crm_brokerages SET country = COALESCE(country, 'United Arab Emirates') WHERE country IS NULL;
