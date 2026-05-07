ALTER TABLE public.crm_owner_settings
  ADD COLUMN IF NOT EXISTS test_profile jsonb NOT NULL DEFAULT '{}'::jsonb;