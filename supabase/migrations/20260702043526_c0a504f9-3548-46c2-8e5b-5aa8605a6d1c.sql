ALTER TABLE public.broker_personal_calendar ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_bpc_deleted_at ON public.broker_personal_calendar(deleted_at);