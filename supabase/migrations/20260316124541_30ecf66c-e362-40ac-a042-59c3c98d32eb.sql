
-- ============================================================
-- SECURITY HARDENING MIGRATION — 33 findings (retry without pg_net)
-- ============================================================

-- ===================== 1. HIGH-RISK UPDATE POLICIES =====================

DROP POLICY IF EXISTS "Public Update" ON public.user_daily_activity;
CREATE POLICY "user_daily_activity_owner_update"
  ON public.user_daily_activity FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public Update" ON public.user_interest_profile;
CREATE POLICY "user_interest_profile_owner_update"
  ON public.user_interest_profile FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public Update" ON public.user_sessions;
CREATE POLICY "user_sessions_session_update"
  ON public.user_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update" ON public.visitor_sessions;
DROP POLICY IF EXISTS "allow_visitor_session_update" ON public.visitor_sessions;
CREATE POLICY "visitor_sessions_update"
  ON public.visitor_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ===================== 2. MEDIUM-RISK INSERT POLICIES =====================

DROP POLICY IF EXISTS "Public Insert" ON public.security_checklist_runs;
CREATE POLICY "security_checklist_runs_service_insert"
  ON public.security_checklist_runs FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.system_backup_records;
CREATE POLICY "system_backup_records_service_insert"
  ON public.system_backup_records FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.user_points_ledger;
CREATE POLICY "user_points_ledger_service_insert"
  ON public.user_points_ledger FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.card_link_clicks;
CREATE POLICY "card_link_clicks_insert"
  ON public.card_link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.cookie_consents;
CREATE POLICY "cookie_consents_insert"
  ON public.cookie_consents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.project_reports;
CREATE POLICY "project_reports_insert"
  ON public.project_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.user_activity_log;
CREATE POLICY "user_activity_log_insert"
  ON public.user_activity_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.user_daily_activity;
CREATE POLICY "user_daily_activity_insert"
  ON public.user_daily_activity FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.user_events;
CREATE POLICY "user_events_insert"
  ON public.user_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.user_interest_profile;
CREATE POLICY "user_interest_profile_insert"
  ON public.user_interest_profile FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert" ON public.user_sessions;
CREATE POLICY "user_sessions_insert"
  ON public.user_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ===================== 3. WEBHOOK_REPLAY_LOG POLICIES =====================

CREATE POLICY "webhook_replay_log_service_select"
  ON public.webhook_replay_log FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "webhook_replay_log_service_insert"
  ON public.webhook_replay_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ===================== 4. FIX FUNCTION SEARCH_PATH =====================

ALTER FUNCTION public.crm_compute_duplicate_hash SET search_path = public;
ALTER FUNCTION public.crm_leads_set_updated_at SET search_path = public;
ALTER FUNCTION public.update_employee_emails_updated_at SET search_path = public;

-- ===================== 5. ADD MISSING COLUMNS TO visitor_sessions =====================

ALTER TABLE public.visitor_sessions
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS screen_resolution TEXT,
  ADD COLUMN IF NOT EXISTS viewport_size TEXT,
  ADD COLUMN IF NOT EXISTS network_type TEXT;
