
-- Email inbox items: every JBJ-related Gmail message we want to surface
CREATE TABLE IF NOT EXISTS public.email_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'info_only',
  action_required TEXT,
  suggested_reply TEXT,
  linked_developer_id UUID,
  linked_contract_url TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0,
  received_at TIMESTAMPTZ,
  raw_subject TEXT,
  from_email TEXT,
  from_name TEXT,
  snippet TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_jbj_related BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS idx_email_inbox_items_user ON public.email_inbox_items(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_inbox_items_category ON public.email_inbox_items(user_id, category, status);
CREATE INDEX IF NOT EXISTS idx_email_inbox_items_developer ON public.email_inbox_items(linked_developer_id);

ALTER TABLE public.email_inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner/admin manage own inbox items"
  ON public.email_inbox_items
  FOR ALL
  USING (
    auth.uid() = user_id
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  );

CREATE TRIGGER trg_email_inbox_items_updated
BEFORE UPDATE ON public.email_inbox_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Registration sync logs
CREATE TABLE IF NOT EXISTS public.developer_registration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  developer_id UUID,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  direction TEXT NOT NULL DEFAULT 'out',
  outcome TEXT NOT NULL DEFAULT 'pending',
  parsed_intent TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_reg_sync_user ON public.developer_registration_sync_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_reg_sync_dev ON public.developer_registration_sync_logs(developer_id);

ALTER TABLE public.developer_registration_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner/admin manage own registration logs"
  ON public.developer_registration_sync_logs
  FOR ALL
  USING (
    auth.uid() = user_id
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  );

-- Developer registry: registration tracking
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS registration_status TEXT,
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_confirmation_message_id TEXT,
  ADD COLUMN IF NOT EXISTS registration_confirmation_sent_at TIMESTAMPTZ;
