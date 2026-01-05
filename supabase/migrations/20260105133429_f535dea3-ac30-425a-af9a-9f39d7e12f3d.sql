-- Fix remaining security issues - drop conflicting policies first

-- Fix memberships table SELECT policy
DROP POLICY IF EXISTS "memberships_select_own_or_admin" ON public.memberships;
CREATE POLICY "memberships_select_own_or_admin" ON public.memberships
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- Clean up duplicate policies on favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_auth_required" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Clean up duplicate policies on shortlists  
DROP POLICY IF EXISTS "Users can view their own shortlists" ON public.shortlists;
DROP POLICY IF EXISTS "shortlists_select_auth_required" ON public.shortlists;
DROP POLICY IF EXISTS "shortlists_select_own" ON public.shortlists;
CREATE POLICY "shortlists_select_own" ON public.shortlists
  FOR SELECT USING (auth.uid() = user_id);

-- Clean up duplicate policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_auth_required" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);