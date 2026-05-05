ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS attended_briefing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attended_briefing_date date,
  ADD COLUMN IF NOT EXISTS briefing_notes text;