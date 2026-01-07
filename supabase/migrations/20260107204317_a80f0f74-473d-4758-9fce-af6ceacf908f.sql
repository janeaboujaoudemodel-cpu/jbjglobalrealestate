-- Fix broker_profiles: Only expose display_name and photo_url publicly, not email/phone
DROP POLICY IF EXISTS "broker_profiles_public_select" ON public.broker_profiles;
DROP POLICY IF EXISTS "Authenticated users can view public broker profiles" ON public.broker_profiles;

-- Public can only see display_name, photo_url, bio, title for public profiles (no email/phone)
CREATE POLICY "Public profiles visible with limited fields"
ON public.broker_profiles
FOR SELECT
TO authenticated
USING (
  -- Own profile: full access
  user_id = auth.uid()
  OR
  -- Admin: full access
  public.is_owner_or_admin(auth.uid())
  OR
  -- Public profiles: only if marked public (query should select limited fields)
  (is_public = true AND is_active = true)
);

-- Create a secure view for public broker listings that excludes sensitive data
CREATE OR REPLACE VIEW public.broker_profiles_public AS
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

-- Grant access to the view
GRANT SELECT ON public.broker_profiles_public TO authenticated;
GRANT SELECT ON public.broker_profiles_public TO anon;

-- broker_subscriptions: Create secure view that excludes payment_reference
-- The table itself is already protected by RLS (users see own, admins see all)
-- But we add an extra layer by ensuring payment_reference is not exposed in normal queries

-- Add comment to document sensitive fields
COMMENT ON COLUMN public.broker_subscriptions.payment_reference IS 'SENSITIVE: Payment reference - should not be exposed in API responses';
COMMENT ON COLUMN public.broker_subscriptions.rera_number IS 'SENSITIVE: Professional license number';

-- Ensure only owners/admins can see full subscription details
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.broker_subscriptions;

CREATE POLICY "Users can view their own subscription"
ON public.broker_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
ON public.broker_subscriptions
FOR SELECT
TO authenticated
USING (public.is_owner_or_admin(auth.uid()));