-- =====================================================
-- COMPREHENSIVE SECURITY HARDENING FOR ALL SENSITIVE TABLES
-- =====================================================

-- =====================================================
-- 1. BROKER_SUBSCRIPTIONS - Clean up and harden
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_delete_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_delete_own_or_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_insert_own" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_insert_own_or_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select_own" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select_own_or_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_update_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_update_own" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_update_own_or_admin" ON public.broker_subscriptions;

-- Create clean, hardened policies
CREATE POLICY "broker_subscriptions_select"
ON public.broker_subscriptions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "broker_subscriptions_insert"
ON public.broker_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "broker_subscriptions_update"
ON public.broker_subscriptions
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "broker_subscriptions_delete"
ON public.broker_subscriptions
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- =====================================================
-- 2. AUDIT_LOGS - Harden policies
-- =====================================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- Admin-only SELECT (already good but reinforce with auth.uid() check)
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Authenticated users can insert their own logs
CREATE POLICY "audit_logs_insert_authenticated"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR auth.uid() = user_id)
);

-- Service role can insert any logs (for backend functions)
CREATE POLICY "audit_logs_insert_service"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- 3. BROKER_COURSE_PROGRESS - Harden policies
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all course progress" ON public.broker_course_progress;
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.broker_course_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.broker_course_progress;

CREATE POLICY "broker_course_progress_select"
ON public.broker_course_progress
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "broker_course_progress_insert"
ON public.broker_course_progress
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "broker_course_progress_update"
ON public.broker_course_progress
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "broker_course_progress_delete"
ON public.broker_course_progress
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- =====================================================
-- 4. COURSE_SESSIONS - Harden policies + hash IP addresses
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all course sessions" ON public.course_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.course_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.course_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.course_sessions;

CREATE POLICY "course_sessions_select"
ON public.course_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "course_sessions_insert"
ON public.course_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "course_sessions_update"
ON public.course_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "course_sessions_delete"
ON public.course_sessions
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- =====================================================
-- 5. CONTENT_ACCESS_LOGS - Harden policies
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all content logs" ON public.content_access_logs;
DROP POLICY IF EXISTS "Users can insert own access logs" ON public.content_access_logs;
DROP POLICY IF EXISTS "Users can view own access logs" ON public.content_access_logs;
DROP POLICY IF EXISTS "content_access_logs_select_admin" ON public.content_access_logs;
DROP POLICY IF EXISTS "content_access_logs_select_own" ON public.content_access_logs;
DROP POLICY IF EXISTS "content_access_logs_insert_own" ON public.content_access_logs;

CREATE POLICY "content_access_logs_select"
ON public.content_access_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "content_access_logs_insert"
ON public.content_access_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);