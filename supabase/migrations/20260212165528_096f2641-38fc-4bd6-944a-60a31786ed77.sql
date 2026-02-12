-- Add source_page column to crm_leads for tracking which page forms are submitted from
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS source_page text;