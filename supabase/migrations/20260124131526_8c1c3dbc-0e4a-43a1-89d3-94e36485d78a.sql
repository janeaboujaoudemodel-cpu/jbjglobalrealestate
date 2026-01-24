-- Fix referral_partners_safe view: Add security_invoker to prevent SECURITY DEFINER warning
-- This ensures the view uses the permissions of the querying user, not the view creator

DROP VIEW IF EXISTS public.referral_partners_safe;

CREATE VIEW public.referral_partners_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  referral_code,
  CASE
    WHEN full_name IS NOT NULL AND POSITION(' ' IN full_name) > 0 
    THEN (split_part(full_name, ' ', 1) || ' ' || LEFT(split_part(full_name, ' ', 2), 1)) || '.'
    ELSE LEFT(full_name, 3) || '***'
  END AS full_name_masked,
  CASE
    WHEN email LIKE '%@%' THEN (LEFT(email, 2) || '***@') || split_part(email, '@', 2)
    ELSE '***'
  END AS email_masked,
  CASE
    WHEN phone_e164 IS NOT NULL AND length(phone_e164) > 4 THEN '***' || RIGHT(phone_e164, 4)
    ELSE '***'
  END AS phone_masked,
  partner_type,
  commission_rate,
  status,
  total_referrals,
  total_conversions,
  total_earnings_aed,
  approved_at,
  created_at,
  updated_at
FROM public.referral_partners;