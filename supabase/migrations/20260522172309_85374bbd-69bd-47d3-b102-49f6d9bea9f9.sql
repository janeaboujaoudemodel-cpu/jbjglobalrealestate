
-- 1. Add source-tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_signup_source TEXT,
  ADD COLUMN IF NOT EXISTS last_signup_source TEXT,
  ADD COLUMN IF NOT EXISTS signup_source_label TEXT,
  ADD COLUMN IF NOT EXISTS picked_role TEXT,
  ADD COLUMN IF NOT EXISTS picked_role_at TIMESTAMPTZ;

-- 2. Append-only event log
CREATE TABLE IF NOT EXISTS public.signup_source_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NULL,
  signup_source TEXT NOT NULL,
  signup_source_label TEXT NOT NULL,
  picked_role TEXT NULL,
  page_path TEXT NULL,
  referrer TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sse_source ON public.signup_source_events(signup_source);
CREATE INDEX IF NOT EXISTS idx_sse_user ON public.signup_source_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sse_email ON public.signup_source_events(lower(email));
CREATE INDEX IF NOT EXISTS idx_sse_created ON public.signup_source_events(created_at DESC);

ALTER TABLE public.signup_source_events ENABLE ROW LEVEL SECURITY;

-- Owner/admin can read everything
DROP POLICY IF EXISTS "Owner reads source events" ON public.signup_source_events;
CREATE POLICY "Owner reads source events"
ON public.signup_source_events
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- Users can read their own events
DROP POLICY IF EXISTS "Users read own source events" ON public.signup_source_events;
CREATE POLICY "Users read own source events"
ON public.signup_source_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Inserts go through the edge function (service role bypasses RLS).
-- No INSERT policy = no direct client inserts.

-- 3. Counter view (live aggregation, no materialization needed at this scale)
CREATE OR REPLACE VIEW public.vw_signup_source_counts AS
SELECT
  signup_source,
  signup_source_label,
  COUNT(*)::bigint AS total_picks,
  COUNT(DISTINCT COALESCE(user_id::text, lower(email)))::bigint AS unique_users,
  COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days')::bigint AS picks_last_30d,
  COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days')::bigint AS picks_last_7d,
  MAX(created_at) AS last_picked_at
FROM public.signup_source_events
GROUP BY signup_source, signup_source_label
ORDER BY total_picks DESC;

-- View inherits RLS from base table → owner/admin only.
