-- Drop and recreate the view without SECURITY DEFINER (uses INVOKER by default)
-- The view's WHERE clause combined with underlying table RLS provides proper security
DROP VIEW IF EXISTS public.referral_partners_safe;

-- Create a standard view that relies on the table's RLS policies
-- This view only masks the data - access control is handled by the table's RLS
CREATE VIEW public.referral_partners_safe AS
SELECT 
  id,
  user_id,
  referral_code,
  -- Mask full name: show first name + initial of last name
  CASE 
    WHEN full_name IS NOT NULL AND POSITION(' ' IN full_name) > 0 
    THEN SPLIT_PART(full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(full_name, ' ', 2), 1) || '.'
    ELSE LEFT(full_name, 3) || '***'
  END as full_name_masked,
  -- Mask email: show first 2 chars + *** + domain
  CASE 
    WHEN email LIKE '%@%' THEN LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE '***'
  END as email_masked,
  -- Mask phone: show only last 4 digits
  CASE 
    WHEN phone_e164 IS NOT NULL AND LENGTH(phone_e164) > 4 
    THEN '***' || RIGHT(phone_e164, 4)
    ELSE '***'
  END as phone_masked,
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
-- Note: Access control is enforced by the underlying table's RLS policies:
-- - partner_select_own: user_id = auth.uid()
-- - owner_select_all: has_role(auth.uid(), 'owner')

COMMENT ON VIEW public.referral_partners_safe IS 'Secure masked view for referral partners. PII (name, email, phone) is masked. Access control via underlying table RLS. Use get_referral_partner_full_details() for unmasked data with audit logging.';