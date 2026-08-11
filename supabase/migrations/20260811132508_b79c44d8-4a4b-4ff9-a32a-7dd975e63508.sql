-- 1) chat_history: anonymous visitors may only insert their OWN messages.
-- Assistant replies must come from the service-role edge function, so a
-- visitor can no longer spoof AI answers into a session transcript.
DROP POLICY IF EXISTS chat_history_anon_insert ON public.chat_history;

CREATE POLICY chat_history_anon_insert
ON public.chat_history
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND session_id IS NOT NULL
  AND length(session_id) > 10
  AND length(session_id) <= 100
  AND role = 'user'
  AND message IS NOT NULL
  AND length(btrim(message)) > 0
  AND length(message) <= 4000
  AND (source IS NULL OR length(source) <= 120)
  AND (source_page IS NULL OR length(source_page) <= 300)
  AND COALESCE(is_flagged, false) = false
  AND flag_reason IS NULL
  AND flagged_by IS NULL
  AND flagged_at IS NULL
  AND check_chat_rate_limit(session_id)
);

-- Authenticated visitors are likewise limited to their own turns; staff
-- (admin/owner) keep the separate chat_history_admin_insert policy.
DROP POLICY IF EXISTS chat_history_owner_insert ON public.chat_history;

CREATE POLICY chat_history_owner_insert
ON public.chat_history
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'user'
  AND (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (user_id IS NULL AND session_id IS NOT NULL AND length(session_id) > 10)
  )
);

-- 2) site_settings: explicit allowlist instead of a '%_visibility' wildcard,
-- so a future internal setting can never become world-readable by naming.
DROP POLICY IF EXISTS "Public can read allowlisted site settings" ON public.site_settings;

CREATE POLICY "Public can read allowlisted site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  setting_key IN (
    'cons_visibility',
    'founder_visibility',
    'podcast_visibility',
    'team_page_visibility',
    'founder_photo_url'
  )
);

-- 3) user_activity_log: anonymous inserts were unbounded (WITH CHECK true).
-- Apply the same per-IP rate limit + field caps used by the other public
-- telemetry tables, and stop clients writing rows owned by another user.
DROP POLICY IF EXISTS user_activity_log_insert ON public.user_activity_log;

CREATE POLICY user_activity_log_insert
ON public.user_activity_log
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND activity_type IS NOT NULL
  AND char_length(activity_type) <= 120
  AND (event_type IS NULL OR char_length(event_type) <= 120)
  AND (tool_name IS NULL OR char_length(tool_name) <= 200)
  AND (page_path IS NULL OR char_length(page_path) <= 500)
  AND (session_id IS NULL OR char_length(session_id) <= 128)
  AND (device_info IS NULL OR char_length(device_info) <= 500)
  AND (lead_email IS NULL OR char_length(lead_email) <= 320)
  AND check_rate_limit(
    COALESCE((current_setting('request.headers', true)::json ->> 'x-forwarded-for'), 'unknown'),
    'user_activity_log',
    600,
    60
  )
);