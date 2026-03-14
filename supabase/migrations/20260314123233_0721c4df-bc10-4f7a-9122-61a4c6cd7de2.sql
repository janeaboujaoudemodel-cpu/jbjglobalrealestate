
-- ============================================================
-- Security Layer 4C: Main Policy Hardening (all except chat_conversations)
-- ============================================================

-- CRITICAL #1: resale_listings
DROP POLICY IF EXISTS "Anyone can view active resale listings" ON public.resale_listings;
DROP POLICY IF EXISTS "Active listings are viewable by anyone" ON public.resale_listings;
DROP POLICY IF EXISTS "Authenticated users can view active resale listings" ON public.resale_listings;

CREATE POLICY "resale_listings_owner_admin_select"
  ON public.resale_listings FOR SELECT TO authenticated
  USING (investor_user_id = auth.uid() OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.resale_listings_public
WITH (security_invoker = on) AS
SELECT id, title, description, location, area_name, emirate, property_type, bedrooms,
       size_sqft, asking_price, currency, developer_name, project_name,
       handover_status, images, status, created_at, updated_at
FROM public.resale_listings WHERE status = 'active';

GRANT SELECT ON public.resale_listings_public TO anon;
GRANT SELECT ON public.resale_listings_public TO authenticated;
REVOKE ALL ON public.resale_listings FROM anon;
REVOKE ALL ON public.resale_listings FROM public;
ALTER TABLE public.resale_listings FORCE ROW LEVEL SECURITY;

-- CRITICAL #2: open_positions
DROP POLICY IF EXISTS "Open positions are viewable by everyone" ON public.open_positions;
DROP POLICY IF EXISTS "Authenticated users can manage positions" ON public.open_positions;

CREATE POLICY "open_positions_public_read_active" ON public.open_positions FOR SELECT TO public USING (is_active = true);
CREATE POLICY "open_positions_owner_admin_insert" ON public.open_positions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "open_positions_owner_admin_update" ON public.open_positions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "open_positions_owner_admin_delete" ON public.open_positions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.open_positions FORCE ROW LEVEL SECURITY;

-- CRITICAL #3: employee_notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.employee_notifications;
CREATE POLICY "employee_notifications_self_or_admin_select" ON public.employee_notifications FOR SELECT TO authenticated
  USING (employee_id = auth.uid()::text OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.employee_notifications FORCE ROW LEVEL SECURITY;

-- HIGH: user_behavior_tracking
DROP POLICY IF EXISTS "Authenticated users can view behavior data" ON public.user_behavior_tracking;
ALTER TABLE public.user_behavior_tracking FORCE ROW LEVEL SECURITY;

-- HIGH: listing_uploads
DROP POLICY IF EXISTS "Admins can view all uploads" ON public.listing_uploads;
CREATE POLICY "listing_uploads_own_or_admin_select" ON public.listing_uploads FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
REVOKE ALL ON public.listing_uploads FROM anon;
REVOKE ALL ON public.listing_uploads FROM public;
ALTER TABLE public.listing_uploads FORCE ROW LEVEL SECURITY;

-- HIGH: book_downloads
DROP POLICY IF EXISTS "Authenticated users can read book downloads" ON public.book_downloads;
CREATE POLICY "book_downloads_owner_admin_select" ON public.book_downloads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.book_downloads FORCE ROW LEVEL SECURITY;

-- HIGH: payout_readiness_records
DROP POLICY IF EXISTS "Authenticated users can view payout readiness" ON public.payout_readiness_records;
DROP POLICY IF EXISTS "Users can view own payout readiness records" ON public.payout_readiness_records;
CREATE POLICY "payout_readiness_owner_admin_select" ON public.payout_readiness_records FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.payout_readiness_records FORCE ROW LEVEL SECURITY;

-- HIGH: payout_audit_logs
DROP POLICY IF EXISTS "Authenticated users can view payout audit logs" ON public.payout_audit_logs;
CREATE POLICY "payout_audit_logs_owner_admin_select" ON public.payout_audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.payout_audit_logs FORCE ROW LEVEL SECURITY;

-- HIGH: admin_edit_log
DROP POLICY IF EXISTS "Authenticated users can read edit logs" ON public.admin_edit_log;
CREATE POLICY "admin_edit_log_owner_admin_select" ON public.admin_edit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.admin_edit_log FORCE ROW LEVEL SECURITY;

-- HIGH: web_developer_tasks
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.web_developer_tasks;
DROP POLICY IF EXISTS "Anyone can view web developer tasks" ON public.web_developer_tasks;
CREATE POLICY "web_developer_tasks_owner_admin_select" ON public.web_developer_tasks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.web_developer_tasks FORCE ROW LEVEL SECURITY;

-- HIGH: web_developer_versions
DROP POLICY IF EXISTS "Authenticated users can view versions" ON public.web_developer_versions;
DROP POLICY IF EXISTS "Anyone can view web developer versions" ON public.web_developer_versions;
CREATE POLICY "web_developer_versions_owner_admin_select" ON public.web_developer_versions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.web_developer_versions FORCE ROW LEVEL SECURITY;

-- HIGH: decision_records
DROP POLICY IF EXISTS "Authenticated users can view decision records" ON public.decision_records;
CREATE POLICY "decision_records_owner_admin_select" ON public.decision_records FOR SELECT TO authenticated
  USING (created_by_user_id = auth.uid() OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
ALTER TABLE public.decision_records FORCE ROW LEVEL SECURITY;

-- MEDIUM: service-role policies
DROP POLICY IF EXISTS "Service role manages health logs" ON public.db_health_logs;
CREATE POLICY "service_role_manages_health_logs" ON public.db_health_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.db_health_logs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.db_health_logs FROM anon;
REVOKE ALL ON public.db_health_logs FROM public;

DROP POLICY IF EXISTS "Service role manages locks" ON public.edge_function_locks;
CREATE POLICY "service_role_manages_locks" ON public.edge_function_locks FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.edge_function_locks FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.edge_function_locks FROM anon;
REVOKE ALL ON public.edge_function_locks FROM public;

DROP POLICY IF EXISTS "Service role manages AI cache" ON public.project_ai_cache;
CREATE POLICY "service_role_manages_ai_cache" ON public.project_ai_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.project_ai_cache FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_ai_cache FROM anon;
REVOKE ALL ON public.project_ai_cache FROM public;

DROP POLICY IF EXISTS "Service role manages dictionaries" ON public.reelly_dictionaries;
DROP POLICY IF EXISTS "Public can read dictionaries" ON public.reelly_dictionaries;
CREATE POLICY "service_role_manages_dictionaries" ON public.reelly_dictionaries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_dictionaries" ON public.reelly_dictionaries FOR SELECT TO authenticated USING (true);
ALTER TABLE public.reelly_dictionaries FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.reelly_dictionaries FROM anon;

DROP POLICY IF EXISTS "Service role manages checklist runs" ON public.security_checklist_runs;
CREATE POLICY "service_role_manages_checklist_runs" ON public.security_checklist_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.security_checklist_runs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_checklist_runs FROM anon;
REVOKE ALL ON public.security_checklist_runs FROM public;

DROP POLICY IF EXISTS "Service role manages backups" ON public.system_backup_records;
CREATE POLICY "service_role_manages_backups" ON public.system_backup_records FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.system_backup_records FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.system_backup_records FROM anon;
REVOKE ALL ON public.system_backup_records FROM public;

DROP POLICY IF EXISTS "Service role inserts dead letters" ON public.inbound_email_dead_letters;
CREATE POLICY "service_role_inserts_dead_letters" ON public.inbound_email_dead_letters FOR INSERT TO service_role WITH CHECK (true);
ALTER TABLE public.inbound_email_dead_letters FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.inbound_email_dead_letters FROM public;
