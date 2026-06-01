ALTER TABLE public.broker_education_module_reads
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_module_reads_user_completed
  ON public.broker_education_module_reads(user_id) WHERE completed_at IS NOT NULL;