-- Drop the existing unsafe view and recreate with proper masking
DROP VIEW IF EXISTS public.referral_partners_safe;

-- Create a properly masked secure view for referral partners
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
  -- Only show earnings to owners
  CASE 
    WHEN public.has_role(auth.uid(), 'owner'::public.app_role) THEN total_earnings_aed
    WHEN user_id = auth.uid() THEN total_earnings_aed
    ELSE NULL
  END as total_earnings_aed,
  approved_at,
  created_at,
  updated_at
FROM public.referral_partners
WHERE 
  -- Partners can see their own record
  user_id = auth.uid()
  -- Owners can see all
  OR public.has_role(auth.uid(), 'owner'::public.app_role);

-- Create a function to get full partner details with mandatory logging
CREATE OR REPLACE FUNCTION public.get_referral_partner_full_details(p_partner_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  phone_e164 text,
  partner_type text,
  commission_rate numeric,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the partner's user_id
  SELECT rp.user_id INTO v_user_id
  FROM referral_partners rp
  WHERE rp.id = p_partner_id;
  
  -- Only allow owner or the partner themselves to see full details
  IF v_user_id IS NULL OR (v_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'owner'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: You can only view your own partner details or must be an owner';
  END IF;
  
  -- Log the access (mandatory auditing)
  INSERT INTO public.referral_partner_banking_access_logs (partner_id, user_id, access_type, ip_address)
  VALUES (p_partner_id, auth.uid(), 'view_full_contact', 
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'));
  
  -- Return the full data
  RETURN QUERY
  SELECT 
    rp.id,
    rp.full_name,
    rp.email,
    rp.phone_e164,
    rp.partner_type,
    rp.commission_rate,
    rp.status
  FROM public.referral_partners rp
  WHERE rp.id = p_partner_id;
END;
$$;

-- Create a trigger to log when owners access partner data directly
CREATE OR REPLACE FUNCTION public.log_referral_partner_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access when owner views partner data that isn't their own
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.referral_partner_banking_access_logs (
      partner_id, user_id, access_type, ip_address
    ) VALUES (
      NEW.id, auth.uid(), 'view_via_policy',
      COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Comment explaining the security model
COMMENT ON VIEW public.referral_partners_safe IS 'Secure masked view for referral partners. PII (name, email, phone) is masked. Use get_referral_partner_full_details() function to access full data with mandatory audit logging.';