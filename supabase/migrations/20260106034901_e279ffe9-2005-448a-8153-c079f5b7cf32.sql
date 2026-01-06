-- =====================================================
-- CRITICAL SECURITY FIX: Ensure RLS is enabled and 
-- policies are properly configured on sensitive tables
-- =====================================================

-- 1. BROKER_SUBSCRIPTIONS - Ensure RLS enabled
ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (prevents bypassing)
ALTER TABLE public.broker_subscriptions FORCE ROW LEVEL SECURITY;

-- 2. MEMBERSHIPS - Ensure RLS enabled
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;

-- 3. BROKER_PDF_EXPORTS - Ensure RLS enabled  
ALTER TABLE public.broker_pdf_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_pdf_exports FORCE ROW LEVEL SECURITY;

-- 4. CHAT_CONVERSATIONS - Ensure RLS enabled
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations FORCE ROW LEVEL SECURITY;

-- 5. EVALUATION_REQUESTS - Ensure RLS enabled
ALTER TABLE public.evaluation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_requests FORCE ROW LEVEL SECURITY;

-- 6. LEADS - Ensure RLS enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- 7. COURSE_SESSIONS - Ensure RLS enabled
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions FORCE ROW LEVEL SECURITY;

-- Add admin SELECT policy for course_sessions (was missing)
DROP POLICY IF EXISTS "Admins can view all course sessions" ON public.course_sessions;
CREATE POLICY "Admins can view all course sessions"
ON public.course_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. CONTENT_ACCESS_LOGS - Ensure RLS enabled
ALTER TABLE public.content_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access_logs FORCE ROW LEVEL SECURITY;

-- =====================================================
-- Fix broker_course_progress - add admin access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all course progress" ON public.broker_course_progress;
CREATE POLICY "Admins can view all course progress"
ON public.broker_course_progress
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- Fix broker_pdf_exports - add admin access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all pdf exports" ON public.broker_pdf_exports;
CREATE POLICY "Admins can view all pdf exports"
ON public.broker_pdf_exports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- Ensure evaluation_requests requires auth for insert
-- =====================================================
DROP POLICY IF EXISTS "evaluation_requests_insert" ON public.evaluation_requests;
CREATE POLICY "evaluation_requests_insert"
ON public.evaluation_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous insert for evaluation requests (public form)
DROP POLICY IF EXISTS "evaluation_requests_anon_insert" ON public.evaluation_requests;
CREATE POLICY "evaluation_requests_anon_insert"
ON public.evaluation_requests
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);