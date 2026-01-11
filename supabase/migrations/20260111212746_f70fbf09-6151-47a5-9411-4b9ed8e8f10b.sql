-- Drop the existing view first, then recreate with correct columns
DROP VIEW IF EXISTS public.broker_profiles_public;

-- Create secure view for public broker data (excludes email and phone)
CREATE VIEW public.broker_profiles_public AS
SELECT 
  id,
  user_id,
  display_name,
  bio,
  photo_url,
  title,
  specializations,
  languages,
  years_experience,
  is_active,
  is_public,
  created_at,
  updated_at
FROM public.broker_profiles
WHERE is_public = true AND is_active = true;

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.broker_profiles_public TO anon, authenticated;

-- Create proper RLS policies for the broker_profiles table
-- Policy 1: Users can view their own full profile (including email/phone)
CREATE POLICY "broker_profiles_owner_select"
ON public.broker_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Admins can view all profiles
CREATE POLICY "broker_profiles_admin_select"
ON public.broker_profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);