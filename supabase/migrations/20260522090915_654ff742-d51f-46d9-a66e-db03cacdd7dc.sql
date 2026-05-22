
-- 1. Lead share publish mode (default manual = owner edits hidden until published)
ALTER TABLE public.crm_lead_shares
  ADD COLUMN IF NOT EXISTS publish_mode text NOT NULL DEFAULT 'manual'
    CHECK (publish_mode IN ('auto','manual'));

-- 2. Owner-edit publish queue
CREATE TABLE IF NOT EXISTS public.crm_lead_publish_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid REFERENCES public.crm_lead_shares(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  broker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL REFERENCES auth.users(id),
  field_diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  published_by uuid REFERENCES auth.users(id),
  discarded_at timestamptz,
  discard_reason text
);
CREATE INDEX IF NOT EXISTS idx_lead_publish_queue_broker_pending
  ON public.crm_lead_publish_queue (broker_user_id, created_at DESC)
  WHERE published_at IS NULL AND discarded_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_publish_queue_lead
  ON public.crm_lead_publish_queue (lead_id);

ALTER TABLE public.crm_lead_publish_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_publish_queue" ON public.crm_lead_publish_queue
  FOR ALL TO authenticated
  USING (auth.email() = 'janeaboujaoudenails@gmail.com')
  WITH CHECK (auth.email() = 'janeaboujaoudenails@gmail.com');

CREATE POLICY "broker_read_own_published" ON public.crm_lead_publish_queue
  FOR SELECT TO authenticated
  USING (broker_user_id = auth.uid() AND published_at IS NOT NULL);

-- 3. Additional grant visibility flags (status_filter already exists)
ALTER TABLE public.crm_database_grants
  ADD COLUMN IF NOT EXISTS visible_notes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_files boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_activities boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scope jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 4. Broker 2FA (TOTP) secrets
CREATE TABLE IF NOT EXISTS public.broker_2fa_secrets (
  broker_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  enrolled_at timestamptz,
  last_verified_at timestamptz,
  recovery_codes_hash text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broker_2fa_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_2fa" ON public.broker_2fa_secrets
  FOR ALL TO authenticated
  USING (auth.email() = 'janeaboujaoudenails@gmail.com')
  WITH CHECK (auth.email() = 'janeaboujaoudenails@gmail.com');

CREATE POLICY "broker_self_2fa" ON public.broker_2fa_secrets
  FOR ALL TO authenticated
  USING (broker_user_id = auth.uid())
  WITH CHECK (broker_user_id = auth.uid());

-- 5. Per-file broker grants
CREATE TABLE IF NOT EXISTS public.crm_file_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  bucket text NOT NULL DEFAULT 'crm-files',
  broker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  notes text,
  UNIQUE (file_path, broker_user_id, bucket)
);
CREATE INDEX IF NOT EXISTS idx_file_grants_broker_active
  ON public.crm_file_grants (broker_user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.crm_file_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_file_grants" ON public.crm_file_grants
  FOR ALL TO authenticated
  USING (auth.email() = 'janeaboujaoudenails@gmail.com')
  WITH CHECK (auth.email() = 'janeaboujaoudenails@gmail.com');

CREATE POLICY "broker_read_own_file_grants" ON public.crm_file_grants
  FOR SELECT TO authenticated
  USING (broker_user_id = auth.uid() AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now()));

-- 6. Auto-updated_at trigger reuse (function already exists in project)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_2fa_updated_at ON public.broker_2fa_secrets';
    EXECUTE 'CREATE TRIGGER trg_2fa_updated_at BEFORE UPDATE ON public.broker_2fa_secrets
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;
