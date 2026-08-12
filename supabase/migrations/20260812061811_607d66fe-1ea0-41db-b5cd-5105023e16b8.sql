ALTER TABLE public.owner_calendar_sync_state
  ADD COLUMN IF NOT EXISTS account_key text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS account_label text;

UPDATE public.owner_calendar_sync_state
SET calendar_id = COALESCE(calendar_id, 'primary'),
    is_enabled = false,
    pull_enabled = false,
    push_enabled = false;

ALTER TABLE public.owner_calendar_sync_state
  ALTER COLUMN calendar_id SET DEFAULT 'primary',
  ALTER COLUMN calendar_id SET NOT NULL;

ALTER TABLE public.owner_calendar_sync_state
  DROP CONSTRAINT IF EXISTS owner_calendar_sync_state_owner_id_provider_key;

DROP INDEX IF EXISTS public.owner_calendar_sync_state_owner_id_provider_key;
CREATE UNIQUE INDEX IF NOT EXISTS owner_calendar_sync_state_target_uniq
  ON public.owner_calendar_sync_state (owner_id, provider, account_key, calendar_id);

ALTER TABLE public.owner_calendar_events
  ADD COLUMN IF NOT EXISTS external_account_key text;

DROP INDEX IF EXISTS public.owner_calendar_events_external_uniq;
CREATE UNIQUE INDEX owner_calendar_events_external_uniq
  ON public.owner_calendar_events (owner_id, provider, external_account_key, external_id)
  WHERE external_id IS NOT NULL;

CREATE TABLE public.owner_calendar_api_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  permissions text[] NOT NULL DEFAULT ARRAY['events:read','events:write']::text[],
  allowed_origins text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT owner_calendar_api_clients_name_chk CHECK (char_length(name) BETWEEN 1 AND 120),
  CONSTRAINT owner_calendar_api_clients_permissions_chk CHECK (permissions <@ ARRAY['events:read','events:write']::text[])
);

GRANT ALL ON public.owner_calendar_api_clients TO service_role;
ALTER TABLE public.owner_calendar_api_clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX owner_calendar_api_clients_owner_idx
  ON public.owner_calendar_api_clients (owner_id, is_active, created_at DESC);