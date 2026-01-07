-- Drop the SECURITY DEFINER view and recreate as regular view
DROP VIEW IF EXISTS public.broker_profiles_public;

-- Create regular view (not security definer) for public broker listings
CREATE VIEW public.broker_profiles_public AS
SELECT 
  id,
  user_id,
  display_name,
  photo_url,
  bio,
  title,
  specializations,
  languages,
  years_experience,
  is_public,
  is_active
FROM public.broker_profiles
WHERE is_public = true AND is_active = true;

-- Grant access to the view - it will use the caller's permissions
GRANT SELECT ON public.broker_profiles_public TO authenticated;
GRANT SELECT ON public.broker_profiles_public TO anon;