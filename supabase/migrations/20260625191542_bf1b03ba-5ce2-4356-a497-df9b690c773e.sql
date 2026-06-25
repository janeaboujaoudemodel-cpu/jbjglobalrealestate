
-- Re-run with cc_email NOT NULL handled. Replace hardcoded owner-email
-- policies with has_role(), restrict sensitive columns via column-level
-- REVOKE, tighten hr_job_offers public exposure, and scrub hardcoded
-- personal emails from saved cc fields in crm_owner_settings.

-- 1) Replace hardcoded owner-email policies with has_role(auth.uid(),'owner')
DROP POLICY IF EXISTS "Owner can view all reps" ON public.developer_representatives;
DROP POLICY IF EXISTS "Owner can update all reps" ON public.developer_representatives;
CREATE POLICY "Owner can view all reps" ON public.developer_representatives
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Owner can update all reps" ON public.developer_representatives
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can view all briefings" ON public.briefing_requests;
DROP POLICY IF EXISTS "Owner can update all briefings" ON public.briefing_requests;
CREATE POLICY "Owner can view all briefings" ON public.briefing_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Owner can update all briefings" ON public.briefing_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage all attendance" ON public.briefing_attendance;
CREATE POLICY "Owner can manage all attendance" ON public.briefing_attendance
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage broker lists" ON public.briefing_broker_lists;
CREATE POLICY "Owner can manage broker lists" ON public.briefing_broker_lists
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "owner_reads_broker_activity" ON public.crm_broker_activity_log;
CREATE POLICY "owner_reads_broker_activity" ON public.crm_broker_activity_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage field permissions" ON public.crm_field_permissions;
CREATE POLICY "Owner can manage field permissions" ON public.crm_field_permissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "owner_full_file_grants" ON public.crm_file_grants;
CREATE POLICY "owner_full_file_grants" ON public.crm_file_grants
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "owner_full_publish_queue" ON public.crm_lead_publish_queue;
CREATE POLICY "owner_full_publish_queue" ON public.crm_lead_publish_queue
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner manages all shares" ON public.crm_lead_shares;
CREATE POLICY "Owner manages all shares" ON public.crm_lead_shares
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can read all security events" ON public.crm_security_events;
CREATE POLICY "Owner can read all security events" ON public.crm_security_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can view all messages" ON public.developer_messages;
DROP POLICY IF EXISTS "Owner can update all messages" ON public.developer_messages;
CREATE POLICY "Owner can view all messages" ON public.developer_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Owner can update all messages" ON public.developer_messages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage email signatures" ON public.email_signatures;
CREATE POLICY "Owner can manage email signatures" ON public.email_signatures
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can update launches" ON public.launch_notifications;
CREATE POLICY "Owner can update launches" ON public.launch_notifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage all meeting requests" ON public.meeting_requests;
CREATE POLICY "Owner can manage all meeting requests" ON public.meeting_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can read all audit logs" ON public.project_audit_logs;
CREATE POLICY "Owner can read all audit logs" ON public.project_audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage all change requests" ON public.project_change_requests;
CREATE POLICY "Owner can manage all change requests" ON public.project_change_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage rep activity" ON public.rep_activity_log;
CREATE POLICY "Owner can manage rep activity" ON public.rep_activity_log
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage breakfast slots" ON public.breakfast_slots;
CREATE POLICY "Owner can manage breakfast slots" ON public.breakfast_slots
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can view security events" ON public.api_security_events;
CREATE POLICY "Owner can view security events" ON public.api_security_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'::app_role));

-- 2) Column-level REVOKEs (service_role retains full access)
REVOKE SELECT (otp_code) ON public.phone_verifications FROM anon, authenticated;
REVOKE SELECT (access_token_encrypted, refresh_token_encrypted, scope,
               smtp_host, smtp_port, imap_host, imap_port)
  ON public.broker_email_accounts FROM anon, authenticated;
REVOKE SELECT (session_token_hash) ON public.crm_broker_sessions FROM anon, authenticated;
REVOKE SELECT (email_encrypted, phone_encrypted, notes_encrypted)
  ON public.crm_leads FROM anon, authenticated;
REVOKE SELECT (credentials_encrypted) ON public.executive_integrations FROM anon, authenticated;
REVOKE SELECT (credentials) ON public.owner_comm_channels FROM anon, authenticated;
REVOKE SELECT (access_token_encrypted, refresh_token_encrypted)
  ON public.studio_social_accounts FROM anon, authenticated;
REVOKE SELECT (contact_details, ip_address) ON public.visitor_sessions FROM anon, authenticated;
REVOKE SELECT (html, plain_text) ON public.outreach_locked_payloads FROM anon, authenticated;

-- 3) hr_job_offers: hide salary/commission from anonymous public
REVOKE SELECT (salary_range_min, salary_range_max, commission_structure)
  ON public.hr_job_offers FROM anon;

-- 4) Scrub hardcoded personal email from saved cc fields
UPDATE public.crm_owner_settings
SET cc_email = ''
WHERE cc_email = 'infoo.jane@gmail.com';

UPDATE public.crm_owner_settings
SET saved_cc_emails = COALESCE(
  (SELECT jsonb_agg(e) FROM jsonb_array_elements_text(saved_cc_emails) AS e
   WHERE e <> 'infoo.jane@gmail.com'),
  '[]'::jsonb
)
WHERE saved_cc_emails @> '"infoo.jane@gmail.com"'::jsonb;

UPDATE public.crm_owner_settings
SET active_cc_emails = COALESCE(
  (SELECT jsonb_agg(e) FROM jsonb_array_elements_text(active_cc_emails) AS e
   WHERE e <> 'infoo.jane@gmail.com'),
  '[]'::jsonb
)
WHERE active_cc_emails @> '"infoo.jane@gmail.com"'::jsonb;
