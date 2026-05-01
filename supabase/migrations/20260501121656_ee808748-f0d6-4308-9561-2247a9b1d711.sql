
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS field_sources JSONB NOT NULL DEFAULT '{}'::jsonb;
