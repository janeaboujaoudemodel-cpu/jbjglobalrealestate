ALTER TABLE public.crm_owner_settings
  ADD COLUMN IF NOT EXISTS attachments_brokerage jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments_developer jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_templates_brokerage jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_templates_developer jsonb NOT NULL DEFAULT '[]'::jsonb;