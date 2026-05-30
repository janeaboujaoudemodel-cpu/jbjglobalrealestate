
ALTER TABLE public.broker_email_accounts
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS history_id text,
  ADD COLUMN IF NOT EXISTS provider_account_id text;

-- OAuth state tokens (CSRF/PKCE bridge for popup → callback)
CREATE TABLE IF NOT EXISTS public.broker_email_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail','outlook')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_email_oauth_states TO authenticated;
GRANT ALL ON public.broker_email_oauth_states TO service_role;
ALTER TABLE public.broker_email_oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own oauth state" ON public.broker_email_oauth_states
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_broker_email_accounts_sync
  ON public.broker_email_accounts (status, sync_enabled, last_synced_at)
  WHERE status = 'active' AND sync_enabled = true;
