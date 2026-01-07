-- Add birthday column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS birthday date NULL;

-- Add birthday column to crm_leads table
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS birthday date NULL;

-- Create index for birthday queries (for sending birthday emails)
CREATE INDEX IF NOT EXISTS idx_leads_birthday ON public.leads ((EXTRACT(MONTH FROM birthday)), (EXTRACT(DAY FROM birthday)));
CREATE INDEX IF NOT EXISTS idx_crm_leads_birthday ON public.crm_leads ((EXTRACT(MONTH FROM birthday)), (EXTRACT(DAY FROM birthday)));