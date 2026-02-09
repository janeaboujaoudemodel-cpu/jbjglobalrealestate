-- =====================================================
-- PHASE 7: COMPREHENSIVE SECURITY HARDENING MIGRATION
-- =====================================================

-- =====================================================
-- PHASE 7A: HR EMPLOYEES - REMOVE PLAINTEXT COLUMNS
-- =====================================================
-- First drop the dependent view
DROP VIEW IF EXISTS public.hr_employees_secure CASCADE;

-- Drop the unencrypted columns that bypass encryption
ALTER TABLE public.hr_employees DROP COLUMN IF EXISTS email;
ALTER TABLE public.hr_employees DROP COLUMN IF EXISTS phone;
ALTER TABLE public.hr_employees DROP COLUMN IF EXISTS cv_url;

-- Recreate the secure view using encrypted columns only
CREATE OR REPLACE VIEW public.hr_employees_secure AS
SELECT 
    id,
    candidate_id,
    user_id,
    full_name,
    "position",
    department,
    start_date,
    employee_status,
    skills,
    certifications,
    created_at,
    updated_at,
    created_by,
    email_hash,
    phone_hash,
    email_encrypted,
    phone_encrypted,
    cv_url_encrypted
FROM public.hr_employees;

-- Apply RLS to the view
ALTER VIEW public.hr_employees_secure SET (security_invoker = on);

-- =====================================================
-- PHASE 7B: CHAT HISTORY - CONSOLIDATE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Staff can read chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Staff can view all chat history" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_restricted_access" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_admin_select" ON public.chat_history;

-- =====================================================
-- PHASE 7C: HARDEN 5 "ALWAYS TRUE" TABLES
-- =====================================================

-- 1. best_idea_submissions - Require authentication
REVOKE ALL ON TABLE public.best_idea_submissions FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON TABLE public.best_idea_submissions TO authenticated;
GRANT ALL ON TABLE public.best_idea_submissions TO service_role;

DROP POLICY IF EXISTS "Anyone can submit ideas" ON public.best_idea_submissions;
CREATE POLICY "authenticated_submit_ideas" ON public.best_idea_submissions 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "users_view_own_ideas" ON public.best_idea_submissions 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "admin_manage_ideas" ON public.best_idea_submissions 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 2. esign_audit_log - Service role only
REVOKE ALL ON TABLE public.esign_audit_log FROM anon, public;
GRANT INSERT ON TABLE public.esign_audit_log TO service_role;
GRANT SELECT ON TABLE public.esign_audit_log TO authenticated;

DROP POLICY IF EXISTS "System can insert audit logs" ON public.esign_audit_log;
CREATE POLICY "service_role_insert_audit" ON public.esign_audit_log 
  FOR INSERT TO service_role 
  WITH CHECK (true);

CREATE POLICY "admin_read_audit" ON public.esign_audit_log 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 3. esign_signed_documents - Service role insert only (no user_id column)
REVOKE ALL ON TABLE public.esign_signed_documents FROM anon, public;
GRANT SELECT, INSERT ON TABLE public.esign_signed_documents TO service_role;
GRANT SELECT ON TABLE public.esign_signed_documents TO authenticated;

DROP POLICY IF EXISTS "System can insert signed documents" ON public.esign_signed_documents;
CREATE POLICY "service_role_manage_signed_docs" ON public.esign_signed_documents 
  FOR ALL TO service_role 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_view_signed_docs" ON public.esign_signed_documents 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 4. user_feedback - Authenticated only + ownership
REVOKE ALL ON TABLE public.user_feedback FROM anon, public;
GRANT SELECT, INSERT ON TABLE public.user_feedback TO authenticated;
GRANT ALL ON TABLE public.user_feedback TO service_role;

DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback;
CREATE POLICY "authenticated_submit_feedback" ON public.user_feedback 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_view_own_feedback" ON public.user_feedback 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "admin_view_all_feedback" ON public.user_feedback 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 5. user_notifications - Service role insert, user read/update
REVOKE ALL ON TABLE public.user_notifications FROM anon, public;
GRANT INSERT ON TABLE public.user_notifications TO service_role;
GRANT SELECT, UPDATE ON TABLE public.user_notifications TO authenticated;

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.user_notifications;
CREATE POLICY "service_role_insert_notifications" ON public.user_notifications 
  FOR INSERT TO service_role 
  WITH CHECK (true);

CREATE POLICY "users_read_own_notifications" ON public.user_notifications 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON public.user_notifications 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());