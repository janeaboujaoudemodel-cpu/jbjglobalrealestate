ALTER TABLE public.crm_owner_settings
  ADD COLUMN IF NOT EXISTS saved_test_brokerage_names jsonb NOT NULL DEFAULT '[]'::jsonb;