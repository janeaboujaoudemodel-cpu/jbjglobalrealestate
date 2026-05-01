-- =====================================================================
-- Per-channel communication audit log
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.owner_comm_channel_audit_log (
  id          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  channel_id  uuid NULL REFERENCES public.owner_comm_channels(id) ON DELETE SET NULL,
  channel_type text NOT NULL,
  identifier  text NULL,
  event_type  text NOT NULL,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT owner_comm_channel_audit_log_event_type_check
    CHECK (event_type IN (
      'connected',
      'reconnected',
      'synced',
      'sync_failed',
      'auto_replied',
      'auto_reply_skipped',
      'inbound_received'
    ))
);

CREATE INDEX IF NOT EXISTS idx_owner_comm_channel_audit_user_channel_time
  ON public.owner_comm_channel_audit_log (user_id, channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_owner_comm_channel_audit_channel_event_time
  ON public.owner_comm_channel_audit_log (channel_id, event_type, created_at DESC);

ALTER TABLE public.owner_comm_channel_audit_log ENABLE ROW LEVEL SECURITY;

-- Owner can read their own audit rows.
CREATE POLICY "owner_comm_channel_audit_log_owner_select"
  ON public.owner_comm_channel_audit_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for authenticated users — service role bypasses RLS,
-- so only edge functions running with the service-role key can write rows. The log is
-- strictly append-only from the application surface.

-- =====================================================================
-- Per-channel summary view (last connected / synced / auto-reply / inbound)
-- =====================================================================

CREATE OR REPLACE VIEW public.owner_comm_channel_audit_summary
WITH (security_invoker = true)
AS
SELECT
  l.user_id,
  l.channel_id,
  MAX(CASE WHEN l.event_type IN ('connected','reconnected') THEN l.created_at END)
    AS last_connected_at,
  MAX(CASE WHEN l.event_type = 'synced'           THEN l.created_at END)
    AS last_synced_at,
  MAX(CASE WHEN l.event_type = 'sync_failed'      THEN l.created_at END)
    AS last_sync_failed_at,
  MAX(CASE WHEN l.event_type = 'auto_replied'     THEN l.created_at END)
    AS last_auto_reply_at,
  MAX(CASE WHEN l.event_type = 'inbound_received' THEN l.created_at END)
    AS last_inbound_at,
  COUNT(*) FILTER (WHERE l.event_type = 'auto_replied')     AS auto_reply_count,
  COUNT(*) FILTER (WHERE l.event_type = 'inbound_received') AS inbound_count
FROM public.owner_comm_channel_audit_log l
WHERE l.channel_id IS NOT NULL
GROUP BY l.user_id, l.channel_id;

GRANT SELECT ON public.owner_comm_channel_audit_summary TO authenticated;