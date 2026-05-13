ALTER TABLE public.crm_brokerage_agents
  ADD COLUMN IF NOT EXISTS linkedin_url   text,
  ADD COLUMN IF NOT EXISTS instagram_url  text,
  ADD COLUMN IF NOT EXISTS birthday       date,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes          text;