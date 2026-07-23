ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_next_action text,
  ADD COLUMN IF NOT EXISTS ai_draft_reply text,
  ADD COLUMN IF NOT EXISTS registered_status text,
  ADD COLUMN IF NOT EXISTS requested_documents text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='crm_owner_settings' AND column_name='automation_mode'
  ) THEN
    ALTER TABLE public.crm_owner_settings
      ADD COLUMN automation_mode text NOT NULL DEFAULT 'draft_only'
      CHECK (automation_mode IN ('off','draft_only','auto_send'));
  END IF;
END $$;