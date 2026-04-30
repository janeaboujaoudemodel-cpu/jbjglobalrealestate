-- Comm Hub v2: schema extensions only (no cron / no triggers in this pass)

ALTER TABLE public.owner_comm_settings
  ADD COLUMN IF NOT EXISTS confidence_threshold numeric NOT NULL DEFAULT 0.75,
  ADD COLUMN IF NOT EXISTS voice_reply_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_corpus_size integer NOT NULL DEFAULT 0;

ALTER TABLE public.owner_comm_channels
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS connection_id text,
  ADD COLUMN IF NOT EXISTS training_sample_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_owner_comm_channels_user_type
  ON public.owner_comm_channels(user_id, channel_type);

-- Per-provider aggregate view (uses underlying RLS via security_invoker)
CREATE OR REPLACE VIEW public.owner_comm_provider_status
WITH (security_invoker = true) AS
SELECT
  user_id,
  channel_type,
  COUNT(*)::int                                AS channel_count,
  BOOL_OR(is_active)                            AS any_active,
  MAX(last_sync_at)                             AS last_sync_at,
  MAX(updated_at)                               AS updated_at,
  COALESCE(SUM(training_sample_count), 0)::int  AS total_training_samples
FROM public.owner_comm_channels
GROUP BY user_id, channel_type;