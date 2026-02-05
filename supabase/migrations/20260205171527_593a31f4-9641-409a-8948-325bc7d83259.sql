-- Create finance_access role check function
CREATE OR REPLACE FUNCTION public.has_finance_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owner role has finance access (strictest control)
  -- Can be extended to include specific finance staff in future
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role = 'owner'
  );
END;
$$;

-- Create secure view for referral partners that masks financial data
-- Only finance-authorized users see full commission details
DROP VIEW IF EXISTS public.referral_partners_finance_secure;

CREATE VIEW public.referral_partners_finance_secure
WITH (security_invoker = true)
AS
SELECT 
    id,
    user_id,
    referral_code,
    full_name,
    -- Mask email for non-finance users
    CASE 
        WHEN has_finance_access(auth.uid()) OR user_id = auth.uid() 
        THEN email
        ELSE '***@' || split_part(email, '@', 2)
    END AS email,
    -- Mask phone for non-finance users
    CASE 
        WHEN has_finance_access(auth.uid()) OR user_id = auth.uid() 
        THEN phone_e164
        ELSE '****' || right(phone_e164, 4)
    END AS phone_e164,
    partner_type,
    -- Commission rate only visible to finance or self
    CASE 
        WHEN has_finance_access(auth.uid()) OR user_id = auth.uid() 
        THEN commission_rate
        ELSE NULL
    END AS commission_rate,
    status,
    total_referrals,
    total_conversions,
    -- Earnings only visible to finance or self
    CASE 
        WHEN has_finance_access(auth.uid()) OR user_id = auth.uid() 
        THEN total_earnings_aed
        ELSE NULL
    END AS total_earnings_aed,
    notes,
    approved_at,
    approved_by,
    created_at,
    updated_at,
    -- Passport only visible to finance or self
    CASE 
        WHEN has_finance_access(auth.uid()) OR user_id = auth.uid() 
        THEN passport_number
        ELSE NULL
    END AS passport_number,
    nationality,
    contract_signed_at
FROM referral_partners;

-- Grant access to authenticated users (RLS on base table still applies)
GRANT SELECT ON public.referral_partners_finance_secure TO authenticated;

-- Add comment documenting the security model
COMMENT ON VIEW public.referral_partners_finance_secure IS 
'Secure view for referral partners. Commission rates, earnings, and sensitive PII are only visible to finance-authorized users (owners) or the partner themselves.';