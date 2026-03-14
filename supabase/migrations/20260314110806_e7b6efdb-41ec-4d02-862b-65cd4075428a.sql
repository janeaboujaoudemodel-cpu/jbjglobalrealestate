
-- API Security Events table — centralized security event log from edge functions
CREATE TABLE public.api_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  function_name text NOT NULL,
  client_ip text,
  user_id uuid,
  severity text NOT NULL DEFAULT 'medium',
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying recent events
CREATE INDEX idx_api_security_events_created ON public.api_security_events(created_at DESC);
CREATE INDEX idx_api_security_events_type ON public.api_security_events(event_type);
CREATE INDEX idx_api_security_events_severity ON public.api_security_events(severity);

-- RLS: Owner-only SELECT, no UPDATE/DELETE
ALTER TABLE public.api_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view security events"
  ON public.api_security_events FOR SELECT TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = current_setting('app.owner_email', true)
    OR EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND email = 'janeaboujaoudenails@gmail.com'
    )
  );

-- Service role can insert (edge functions use service role)
-- No explicit INSERT policy needed since service role bypasses RLS

-- Webhook replay protection table
CREATE TABLE public.webhook_replay_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_source text NOT NULL,
  event_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_replay_event_unique UNIQUE (event_id)
);

ALTER TABLE public.webhook_replay_log ENABLE ROW LEVEL SECURITY;

-- Index for auto-cleanup queries
CREATE INDEX idx_webhook_replay_received ON public.webhook_replay_log(received_at);
