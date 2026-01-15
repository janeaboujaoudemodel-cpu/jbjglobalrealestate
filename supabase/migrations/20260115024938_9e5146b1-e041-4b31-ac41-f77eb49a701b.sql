
-- Fix Security Definer Views - Add security_invoker=on

-- 1. Drop and recreate broker_subscriptions_safe with security_invoker=on
DROP VIEW IF EXISTS public.broker_subscriptions_safe;
CREATE VIEW public.broker_subscriptions_safe
WITH (security_invoker=on) AS
SELECT 
    id,
    user_id,
    tier,
    status,
    email,
    full_name,
    company_name,
    created_at,
    updated_at,
    starts_at,
    expires_at,
    trial_ends_at,
    ai_credits_used,
    ai_credits_limit,
    pdf_downloads,
    selected_addons,
    currency,
    user_role,
    rera_number
FROM broker_subscriptions;

-- Grant access to the view
GRANT SELECT ON public.broker_subscriptions_safe TO authenticated;

-- 2. Drop and recreate jbj_leads_secure with security_invoker=on
DROP VIEW IF EXISTS public.jbj_leads_secure;
CREATE VIEW public.jbj_leads_secure
WITH (security_invoker=on) AS
SELECT 
    id,
    SPLIT_PART(name, ' ', 1) AS first_name,
    CASE 
        WHEN assigned_broker_id IS NOT NULL THEN '***' || RIGHT(phone, 4)
        ELSE NULL
    END AS masked_phone,
    CASE 
        WHEN assigned_broker_id IS NOT NULL THEN SPLIT_PART(email, '@', 1) || '@***'
        ELSE NULL
    END AS masked_email,
    status,
    assigned_broker_id,
    property_interest,
    budget_range,
    source,
    last_contact,
    created_at,
    updated_at
FROM jbj_leads;

-- Grant access to the view
GRANT SELECT ON public.jbj_leads_secure TO authenticated;

-- 3. Fix referral_partners_secure view (currently definer)
DROP VIEW IF EXISTS public.referral_partners_secure;
CREATE VIEW public.referral_partners_secure
WITH (security_invoker=on) AS
SELECT 
    id,
    user_id,
    referral_code,
    full_name,
    CASE 
        WHEN user_id = auth.uid() THEN email
        ELSE mask_email(email)
    END AS email,
    CASE 
        WHEN user_id = auth.uid() THEN phone_e164
        ELSE mask_phone(phone_e164)
    END AS phone_e164,
    partner_type,
    commission_rate,
    status,
    total_referrals,
    total_conversions,
    total_earnings_aed,
    CASE 
        WHEN user_id = auth.uid() THEN bank_name
        ELSE '***'
    END AS bank_name,
    CASE 
        WHEN user_id = auth.uid() THEN mask_bank_account(bank_account_number)
        ELSE '****'
    END AS bank_account_number,
    CASE 
        WHEN user_id = auth.uid() THEN mask_iban(bank_iban)
        ELSE '****'
    END AS bank_iban,
    notes,
    approved_at,
    approved_by,
    created_at,
    updated_at,
    (user_id = auth.uid()) AS is_owner
FROM referral_partners rp;

-- Grant access to the view
GRANT SELECT ON public.referral_partners_secure TO authenticated;

-- 4. Ensure RLS on base tables is strict (deny direct SELECT for sensitive tables)
-- Note: We can't completely deny SELECT on these tables as some queries need direct access
-- But we ensure the views with security_invoker properly respect caller permissions
