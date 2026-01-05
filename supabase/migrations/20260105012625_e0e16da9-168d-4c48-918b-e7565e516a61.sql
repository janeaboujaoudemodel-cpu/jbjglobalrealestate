-- Strengthen all SELECT policies to explicitly require authentication

-- ======== EVALUATION_REQUESTS - Require auth explicitly ========
DROP POLICY IF EXISTS "eval_select_own_or_admin" ON public.evaluation_requests;
CREATE POLICY "eval_select_auth_required"
ON public.evaluation_requests
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')));

-- ======== MEMBERSHIPS - Require auth explicitly ========
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
DROP POLICY IF EXISTS "members_select_own_or_admin" ON public.memberships;
CREATE POLICY "memberships_select_auth_required"
ON public.memberships
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')));

-- ======== PROFILES - Require auth explicitly ========
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_auth_required"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- ======== QUIZ_RESPONSES - Require auth explicitly ========  
DROP POLICY IF EXISTS "Users can view own responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_select_own" ON public.quiz_responses;
CREATE POLICY "quiz_select_auth_required"
ON public.quiz_responses
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')));

-- ======== FAVORITES - Require auth explicitly ========
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_auth_required"
ON public.favorites
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ======== SHORTLISTS - Require auth explicitly ========
DROP POLICY IF EXISTS "Users can view own shortlist" ON public.shortlists;
DROP POLICY IF EXISTS "shortlists_select_own" ON public.shortlists;
CREATE POLICY "shortlists_select_auth_required"
ON public.shortlists
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);