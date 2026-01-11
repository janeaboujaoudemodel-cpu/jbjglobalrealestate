-- Remove old permissive SELECT policies that expose ALL columns to public
DROP POLICY IF EXISTS "Public can view active public profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Public profiles visible with limited fields" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can view own broker profile" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_own_select" ON public.broker_profiles;

-- Keep only the new secure policies:
-- broker_profiles_owner_select (user can see their own full profile)
-- broker_profiles_admin_select (admins can see all profiles)
-- broker_profiles_admin_all (admin management)
-- Users can manage own broker profile (owner management)
-- Users can insert own broker profile (insert own)
-- broker_profiles_own_update (update own)
-- Users can update own broker profile (update own)

-- Public access should go through the broker_profiles_public VIEW which excludes email/phone