-- 1. Soft-delete column for crm_developer_registry
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_dev_registry_deleted_at
  ON public.crm_developer_registry (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- 2. Index used by Inbox / Pending Actions sub-tabs
CREATE INDEX IF NOT EXISTS idx_developer_action_items_email_status
  ON public.developer_action_items (developer_email, status);

CREATE INDEX IF NOT EXISTS idx_developer_action_items_user_status
  ON public.developer_action_items (user_id, status);
