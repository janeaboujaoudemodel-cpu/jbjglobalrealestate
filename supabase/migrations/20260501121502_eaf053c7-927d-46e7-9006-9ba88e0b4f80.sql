
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_emirate ON public.crm_brokerages(emirate);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_rera ON public.crm_brokerages(rera_license) WHERE rera_license IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_brokerages_owner_rera
  ON public.crm_brokerages(owner_id, rera_license) WHERE rera_license IS NOT NULL;
