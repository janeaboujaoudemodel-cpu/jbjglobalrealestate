ALTER TABLE public.crm_developer_registry 
ADD COLUMN IF NOT EXISTS star_rating numeric(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tier text DEFAULT NULL;

COMMENT ON COLUMN public.crm_developer_registry.star_rating IS 'Owner-curated rating 0.0–5.0 used in CRM Relationships UI.';
COMMENT ON COLUMN public.crm_developer_registry.tier IS 'Strategic tier label (e.g., Tier 1, Tier 2).';