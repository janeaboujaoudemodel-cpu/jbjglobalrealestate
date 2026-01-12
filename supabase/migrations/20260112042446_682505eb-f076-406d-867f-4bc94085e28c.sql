-- Fix Security Issues: Recreate views properly (using only valid app_role enum values: admin, user, owner)

-- 1. Drop any partially created functions from failed migration
DROP FUNCTION IF EXISTS public.get_all_subscriptions_admin();

-- 2. Recreate admin function with correct role enum values
CREATE OR REPLACE FUNCTION public.get_all_subscriptions_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  tier text,
  status text,
  email text,
  full_name text,
  company_name text,
  rera_number text,
  phone text,
  currency text,
  price_usd numeric,
  payment_method text,
  payment_reference text,
  starts_at timestamptz,
  expires_at timestamptz,
  trial_ends_at timestamptz,
  ai_credits_used integer,
  ai_credits_limit integer,
  pdf_downloads integer,
  selected_addons text[],
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bs.id, bs.user_id, bs.tier, bs.status, bs.email, bs.full_name, bs.company_name,
    bs.rera_number, bs.phone, bs.currency, bs.price_usd,
    CASE WHEN bs.payment_method IS NOT NULL THEN '***' ELSE NULL END as payment_method,
    CASE WHEN bs.payment_reference IS NOT NULL THEN CONCAT('***', RIGHT(bs.payment_reference, 4)) ELSE NULL END as payment_reference,
    bs.starts_at, bs.expires_at, bs.trial_ends_at,
    bs.ai_credits_used, bs.ai_credits_limit, bs.pdf_downloads, bs.selected_addons,
    bs.created_at, bs.updated_at
  FROM public.broker_subscriptions bs
  WHERE public.has_role(auth.uid(), 'admin') 
     OR public.has_role(auth.uid(), 'owner');
$$;

-- 3. Create secure broker_subscriptions_safe view with security_barrier
DROP VIEW IF EXISTS public.broker_subscriptions_safe;

CREATE VIEW public.broker_subscriptions_safe WITH (security_barrier = true) AS
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

-- 4. Recreate broker_profiles_public with only safe fields
DROP VIEW IF EXISTS public.broker_profiles_public;

CREATE VIEW public.broker_profiles_public WITH (security_barrier = true) AS
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