ALTER TABLE public.crm_owner_settings
  ADD COLUMN IF NOT EXISTS brokerage_drive_doc_pack_url text,
  ADD COLUMN IF NOT EXISTS brokerage_saved_sender_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brokerage_reply_to_email text,
  ADD COLUMN IF NOT EXISTS brokerage_saved_cc_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brokerage_active_cc_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brokerage_from_name text,
  ADD COLUMN IF NOT EXISTS saved_test_to_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS saved_test_cc_emails jsonb NOT NULL DEFAULT '[]'::jsonb;