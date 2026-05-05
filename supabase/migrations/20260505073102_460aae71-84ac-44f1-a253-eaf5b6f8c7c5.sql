ALTER TABLE public.crm_brokerage_deals
  ADD COLUMN IF NOT EXISTS agent_name text,
  ADD COLUMN IF NOT EXISTS agent_email text;
CREATE INDEX IF NOT EXISTS idx_crm_brokerage_deals_brokerage_closed
  ON public.crm_brokerage_deals (brokerage_id, closed_on DESC);