ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS office_map_url text,
  ADD COLUMN IF NOT EXISTS top_active_agents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS represented_developer_id uuid,
  ADD COLUMN IF NOT EXISTS represented_developer_name text;

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_represented_dev
  ON public.crm_brokerages(represented_developer_id)
  WHERE represented_developer_id IS NOT NULL;

ALTER TABLE public.crm_owner_settings
  ADD COLUMN IF NOT EXISTS default_brokerage_sender_developer_id uuid,
  ADD COLUMN IF NOT EXISTS default_brokerage_sender_developer_name text;