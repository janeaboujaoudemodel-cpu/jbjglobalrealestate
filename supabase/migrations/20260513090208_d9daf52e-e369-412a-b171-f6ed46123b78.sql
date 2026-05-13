
-- Developer Registry: missing universal fields
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS inquiry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partnership_status text,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS number_of_brokers integer,
  ADD COLUMN IF NOT EXISTS google_maps_link text;

-- Brokerage Agencies: missing universal fields
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS partnership_status text,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS google_maps_link text;

-- Brokerage Agents (owners / directors / agency-side brokers)
ALTER TABLE public.crm_brokerage_agents
  ADD COLUMN IF NOT EXISTS emirate text,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS google_maps_link text,
  ADD COLUMN IF NOT EXISTS google_reviews_url text,
  ADD COLUMN IF NOT EXISTS partnership_status text,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS registration_status text,
  ADD COLUMN IF NOT EXISTS inquiry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closed_deals_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- Individual Brokers
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS emirate text,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS google_maps_link text,
  ADD COLUMN IF NOT EXISTS google_reviews_url text,
  ADD COLUMN IF NOT EXISTS google_reviews_count integer,
  ADD COLUMN IF NOT EXISTS google_reviews_score numeric(3,2),
  ADD COLUMN IF NOT EXISTS partnership_status text,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS registration_status text,
  ADD COLUMN IF NOT EXISTS inquiry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closed_deals_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- Helpful filter indexes
CREATE INDEX IF NOT EXISTS idx_dev_registry_partnership_status ON public.crm_developer_registry (partnership_status);
CREATE INDEX IF NOT EXISTS idx_brokerages_partnership_status ON public.crm_brokerages (partnership_status);
CREATE INDEX IF NOT EXISTS idx_brokerage_agents_assigned_to ON public.crm_brokerage_agents (assigned_to);
CREATE INDEX IF NOT EXISTS idx_brokers_assigned_to ON public.crm_brokers (assigned_to);
