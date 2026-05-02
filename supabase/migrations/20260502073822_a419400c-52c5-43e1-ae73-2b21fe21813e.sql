ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS star_rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS estimated_agent_count integer,
  ADD COLUMN IF NOT EXISTS directory_rank integer,
  ADD COLUMN IF NOT EXISTS last_directory_sync_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_rank
  ON public.crm_brokerages(owner_id, directory_rank);
