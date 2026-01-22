-- =====================================================
-- SECURITY HARDENING: Complete fix for all warnings
-- =====================================================

-- 1. Fix function search_path for check_chat_rate_limit
CREATE OR REPLACE FUNCTION public.check_chat_rate_limit(p_session_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM public.chat_history
    WHERE session_id = p_session_id
    AND created_at > NOW() - INTERVAL '1 minute'
  ) < 20;
END;
$$;

-- 2. Fix function search_path for check_lead_submission_rate
CREATE OR REPLACE FUNCTION public.check_lead_submission_rate(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM public.leads
    WHERE email = p_email
    AND created_at > NOW() - INTERVAL '24 hours'
  ) < 2;
END;
$$;

-- 3. Fix banking_access_audit
DROP POLICY IF EXISTS "banking_audit_service_insert" ON public.banking_access_audit;
CREATE POLICY "banking_audit_authenticated_insert"
ON public.banking_access_audit FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 4. Fix employee_salary_access_audit
DROP POLICY IF EXISTS "employee_salary_audit_service_insert" ON public.employee_salary_access_audit;
CREATE POLICY "salary_audit_authenticated_insert"
ON public.employee_salary_access_audit FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 5. Fix security_audit_log
DROP POLICY IF EXISTS "security_audit_log_service_insert" ON public.security_audit_log;
CREATE POLICY "security_audit_admin_insert"
ON public.security_audit_log FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 6. Fix contact_gating_submissions
DROP POLICY IF EXISTS "Public can submit contact info for gated content" ON public.contact_gating_submissions;
CREATE POLICY "Rate limited contact gating submissions"
ON public.contact_gating_submissions FOR INSERT
WITH CHECK (check_rate_limit(email, 'contact_gating', 5, 60));

-- 7. Fix vapi_call_logs
DROP POLICY IF EXISTS "vapi_call_logs_insert_service" ON public.vapi_call_logs;
CREATE POLICY "vapi_logs_admin_insert"
ON public.vapi_call_logs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 8. Fix web_developer_tasks
DROP POLICY IF EXISTS "Authenticated users can create web developer tasks" ON public.web_developer_tasks;
DROP POLICY IF EXISTS "Authenticated users can update web developer tasks" ON public.web_developer_tasks;
CREATE POLICY "web_dev_tasks_auth_insert"
ON public.web_developer_tasks FOR INSERT
TO authenticated
WITH CHECK (assigned_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

CREATE POLICY "web_dev_tasks_auth_update"
ON public.web_developer_tasks FOR UPDATE
TO authenticated
USING (assigned_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 9. Fix web_developer_versions
DROP POLICY IF EXISTS "Authenticated users can create versions" ON public.web_developer_versions;
CREATE POLICY "web_dev_versions_auth_insert"
ON public.web_developer_versions FOR INSERT
TO authenticated
WITH CHECK (created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 10. Fix decision_records
DROP POLICY IF EXISTS "Authenticated users can create decision records" ON public.decision_records;
CREATE POLICY "decision_records_auth_insert"
ON public.decision_records FOR INSERT
TO authenticated
WITH CHECK (created_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 11. Fix payout_readiness_records
DROP POLICY IF EXISTS "Authenticated users can create payout readiness" ON public.payout_readiness_records;
DROP POLICY IF EXISTS "Authenticated users can update payout readiness" ON public.payout_readiness_records;
CREATE POLICY "payout_readiness_admin_insert"
ON public.payout_readiness_records FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

CREATE POLICY "payout_readiness_admin_update"
ON public.payout_readiness_records FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 12. Fix payout_audit_logs
DROP POLICY IF EXISTS "Authenticated users can create payout audit logs" ON public.payout_audit_logs;
CREATE POLICY "payout_audit_admin_insert"
ON public.payout_audit_logs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 13. Fix listing_notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.listing_notifications;
CREATE POLICY "listing_notifications_admin_insert"
ON public.listing_notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_listing_admin(auth.uid()));

-- 14. Fix chat_conversations
DROP POLICY IF EXISTS "Public can start chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update their own chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_rate_limited_insert" ON public.chat_conversations;
CREATE POLICY "chat_conversations_rate_limited_insert"
ON public.chat_conversations FOR INSERT
WITH CHECK (check_rate_limit(COALESCE(user_email, 'anon'), 'chat_conversation', 10, 60));

CREATE POLICY "chat_conversations_staff_update"
ON public.chat_conversations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_crm_admin(auth.uid()));