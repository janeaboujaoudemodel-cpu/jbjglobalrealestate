-- 1. Extend crm_developer_registry with contract sync fields
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_document_url text,
  ADD COLUMN IF NOT EXISTS contract_email_subject text,
  ADD COLUMN IF NOT EXISTS contract_email_message_id text,
  ADD COLUMN IF NOT EXISTS contract_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_dev_registry_contract_signed
  ON public.crm_developer_registry (contract_signed_at)
  WHERE contract_signed_at IS NOT NULL;

-- 2. New audit table for signed-contract email sync
CREATE TABLE IF NOT EXISTS public.developer_contract_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  developer_id uuid REFERENCES public.crm_developer_registry(id) ON DELETE SET NULL,
  developer_name text,
  developer_email text,
  gmail_message_id text NOT NULL,
  gmail_thread_id text,
  sender_email text,
  sender_name text,
  subject text,
  snippet text,
  attachment_names text[] NOT NULL DEFAULT '{}',
  document_url text,
  match_confidence numeric(3,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'matched' CHECK (status IN ('matched','needs_review','duplicate','no_match','error')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dev_contract_sync_msg
  ON public.developer_contract_sync_logs (user_id, gmail_message_id);

CREATE INDEX IF NOT EXISTS idx_dev_contract_sync_dev
  ON public.developer_contract_sync_logs (developer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_contract_sync_status
  ON public.developer_contract_sync_logs (user_id, status, created_at DESC);

ALTER TABLE public.developer_contract_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_admin_read_dev_contract_sync" ON public.developer_contract_sync_logs;
CREATE POLICY "owner_admin_read_dev_contract_sync"
  ON public.developer_contract_sync_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "service_role_write_dev_contract_sync" ON public.developer_contract_sync_logs;
CREATE POLICY "service_role_write_dev_contract_sync"
  ON public.developer_contract_sync_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
