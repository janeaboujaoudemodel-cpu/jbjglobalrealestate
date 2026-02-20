
-- Add lead_email and event_type columns to existing user_activity_log table
ALTER TABLE public.user_activity_log 
  ADD COLUMN IF NOT EXISTS lead_email text,
  ADD COLUMN IF NOT EXISTS event_type text;

-- Enable RLS if not already enabled
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any and recreate
DROP POLICY IF EXISTS "Anyone can insert activity events" ON public.user_activity_log;
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON public.user_activity_log;

-- Insert-only for anonymous users
CREATE POLICY "Anyone can insert activity events"
  ON public.user_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Select for authenticated users only
CREATE POLICY "Authenticated users can view activity logs"
  ON public.user_activity_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for fast per-lead lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_log_email ON public.user_activity_log(lead_email);
