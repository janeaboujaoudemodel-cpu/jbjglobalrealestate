-- Speeds up the ordered fetch used by the Relationships page (ORDER BY updated_at DESC).
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_updated_at_desc
  ON public.crm_brokerages (updated_at DESC);