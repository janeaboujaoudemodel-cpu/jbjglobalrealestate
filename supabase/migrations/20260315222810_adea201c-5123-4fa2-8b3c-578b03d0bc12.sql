-- Schedule abuse detection engine to run every 15 minutes
SELECT cron.schedule(
  'detect-api-abuse-scan',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/detect-api-abuse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Create index on api_security_events for faster abuse pattern queries
CREATE INDEX IF NOT EXISTS idx_api_security_events_ip_time 
  ON public.api_security_events (client_ip, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_security_events_type_time 
  ON public.api_security_events (event_type, created_at DESC);

-- Create index on function_rate_limits for cleanup queries
CREATE INDEX IF NOT EXISTS idx_function_rate_limits_window 
  ON public.function_rate_limits (window_start);

-- Add abuse detection log table for dashboard analytics
CREATE TABLE IF NOT EXISTS public.abuse_detection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_time timestamptz DEFAULT now(),
  patterns_detected integer DEFAULT 0,
  patterns jsonb DEFAULT '[]'::jsonb,
  cleanup_stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.abuse_detection_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view abuse logs"
  ON public.abuse_detection_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));