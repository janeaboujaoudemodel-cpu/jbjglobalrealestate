
-- Security hardening: replace overly permissive WITH CHECK (true) INSERT policies
-- on audit/alert tables with actor-scoped policies. Prevents any authenticated
-- user from spoofing another user's identity when writing to these logs.
-- Public form-submission tables (inquiries, meeting_bookings, etc.) intentionally
-- keep permissive INSERTs and are NOT changed.

-- admin_edit_log: only allow writes where user_id matches the caller (or NULL if unknown, still tied to session)
DROP POLICY IF EXISTS "Authenticated users can insert edit logs" ON public.admin_edit_log;
CREATE POLICY "Users insert own edit logs"
  ON public.admin_edit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- global_audit_events: force user_id to match caller
DROP POLICY IF EXISTS "authenticated_insert_global_audit" ON public.global_audit_events;
CREATE POLICY "authenticated_insert_own_global_audit"
  ON public.global_audit_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- suspicious_admin_alerts: force user_id to match caller (client-side telemetry only)
DROP POLICY IF EXISTS "authenticated_insert_suspicious_alerts" ON public.suspicious_admin_alerts;
CREATE POLICY "authenticated_insert_own_suspicious_alerts"
  ON public.suspicious_admin_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Remove duplicate/legacy public-facing INSERT policies that duplicate anon+auth policies
-- (both grant the same thing; dropping the {public} duplicates cleans up the surface)
DROP POLICY IF EXISTS "Anyone can log a click" ON public.card_link_clicks;
DROP POLICY IF EXISTS "Anyone can insert cookie consent" ON public.cookie_consents;
DROP POLICY IF EXISTS "Anyone can submit project reports" ON public.project_reports;
DROP POLICY IF EXISTS "Anyone can insert activity events" ON public.user_activity_log;
DROP POLICY IF EXISTS "Anyone can insert events" ON public.user_events;
