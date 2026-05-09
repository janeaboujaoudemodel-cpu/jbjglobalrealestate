ALTER TABLE public.crm_email_campaigns
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS reply_to text,
  ADD COLUMN IF NOT EXISTS segment_id uuid REFERENCES public.crm_segments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS segment_filter jsonb;