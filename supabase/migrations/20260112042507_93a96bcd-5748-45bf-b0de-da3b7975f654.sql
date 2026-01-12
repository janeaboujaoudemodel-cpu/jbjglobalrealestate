-- Fix Security Definer View warnings by using security_invoker instead

-- 1. Recreate broker_subscriptions_safe with security_invoker
DROP VIEW IF EXISTS public.broker_subscriptions_safe;

CREATE VIEW public.broker_subscriptions_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  tier,
  status,
  email,
  full_name,
  company_name,
  currency,
  price_usd,
  starts_at,
  expires_at,
  trial_ends_at,
  ai_credits_used,
  ai_credits_limit,
  pdf_downloads,
  selected_addons,
  created_at,
  updated_at
FROM public.broker_subscriptions
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin')
   OR public.has_role(auth.uid(), 'owner');

-- Revoke public access, only authenticated users can use
REVOKE ALL ON public.broker_subscriptions_safe FROM anon;
GRANT SELECT ON public.broker_subscriptions_safe TO authenticated;

-- 2. Recreate broker_profiles_public with security_invoker
DROP VIEW IF EXISTS public.broker_profiles_public;

CREATE VIEW public.broker_profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  bio,
  photo_url,
  title,
  specializations,
  languages,
  years_experience,
  is_public,
  is_active
FROM public.broker_profiles
WHERE is_public = true AND is_active = true;

-- Intentionally public for directory
GRANT SELECT ON public.broker_profiles_public TO anon, authenticated;
COMMENT ON VIEW public.broker_profiles_public IS 'Public broker directory - excludes email, phone, user_id for privacy';