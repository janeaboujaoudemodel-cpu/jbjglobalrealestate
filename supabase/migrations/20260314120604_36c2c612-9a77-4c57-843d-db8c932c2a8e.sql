
-- trusted_devices table
CREATE TABLE public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text,
  browser text,
  os text,
  last_used_at timestamptz DEFAULT now(),
  trusted_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  is_revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON public.trusted_devices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can revoke own devices"
  ON public.trusted_devices FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- login_events table
CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  client_ip text,
  device_fingerprint text,
  user_agent text,
  browser text,
  os text,
  country text,
  city text,
  event_type text NOT NULL DEFAULT 'success',
  failure_reason text,
  is_suspicious boolean DEFAULT false,
  anomaly_reasons text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Owner can read all login events
CREATE POLICY "Owner can view login events"
  ON public.login_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- Create indexes
CREATE INDEX idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX idx_login_events_created_at ON public.login_events(created_at DESC);
CREATE INDEX idx_login_events_event_type ON public.login_events(event_type);
CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);
