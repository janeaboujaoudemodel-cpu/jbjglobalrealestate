-- Add is_investor flag to crm_leads (non-destructive)
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS is_investor BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_crm_leads_is_investor ON public.crm_leads (is_investor) WHERE is_investor = true;