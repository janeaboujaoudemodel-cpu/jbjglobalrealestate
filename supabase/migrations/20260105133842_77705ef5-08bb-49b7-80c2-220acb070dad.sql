-- Fix remaining critical security issues

-- 1. Fix evaluation_requests - remove blanket auth check, ensure only own data or admin
DROP POLICY IF EXISTS "eval_select_auth_required" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_select_own_or_admin" ON public.evaluation_requests;

CREATE POLICY "evaluation_requests_select_own_or_admin" ON public.evaluation_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- 2. Fix memberships - remove blanket auth check
DROP POLICY IF EXISTS "memberships_select_auth_required" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_own_or_admin" ON public.memberships;

CREATE POLICY "memberships_select_own_or_admin" ON public.memberships
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- 3. Fix quiz_responses - remove blanket auth check
DROP POLICY IF EXISTS "quiz_select_auth_required" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_select_own_or_admin" ON public.quiz_responses;

CREATE POLICY "quiz_responses_select_own_or_admin" ON public.quiz_responses
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      session_id = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- 4. Clean up duplicate shortlist policy
DROP POLICY IF EXISTS "Users can view their own shortlist" ON public.shortlists;

-- 5. Add admin access to profiles for support
CREATE POLICY "profiles_admin_access" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 6. Add admin access to favorites for analytics
CREATE POLICY "favorites_admin_access" ON public.favorites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 7. Add admin access to shortlists for analytics
CREATE POLICY "shortlists_admin_access" ON public.shortlists
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );