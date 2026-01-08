-- Remove the problematic policies that allow public (unauthenticated) access
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- The proper policies already exist:
-- "Users can view their own profile" - SELECT where auth.uid() = id (authenticated)
-- "Admins can view all profiles" - SELECT where has_role(auth.uid(), 'admin' or 'owner') (authenticated)
-- "Users can insert their own profile" - INSERT with auth.uid() = id (authenticated)
-- "Users can update their own profile" - UPDATE where auth.uid() = id (authenticated)