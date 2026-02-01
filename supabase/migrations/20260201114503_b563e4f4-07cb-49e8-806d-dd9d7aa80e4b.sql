-- Fix SECURITY DEFINER views by recreating them with security_invoker = true
-- This ensures views respect RLS policies of the underlying tables

-- 1. best_idea_submissions_safe
DROP VIEW IF EXISTS public.best_idea_submissions_safe;
CREATE VIEW public.best_idea_submissions_safe 
WITH (security_invoker = true) AS
SELECT id, full_name, email, phone, idea, is_anonymous,
    CASE WHEN is_anonymous = true THEN NULL::text ELSE actual_name END AS actual_name,
    CASE WHEN is_anonymous = true THEN NULL::text ELSE actual_email END AS actual_email,
    CASE WHEN is_anonymous = true THEN NULL::text ELSE actual_phone END AS actual_phone,
    status, admin_notes, draw_ticket_number, reviewed_at, reviewed_by, user_id, created_at, updated_at
FROM best_idea_submissions;

-- 2. broker_profiles_public
DROP VIEW IF EXISTS public.broker_profiles_public;
CREATE VIEW public.broker_profiles_public 
WITH (security_invoker = true) AS
SELECT id, display_name, bio, photo_url, title, specializations, languages, years_experience, is_public, is_active
FROM broker_profiles
WHERE is_public = true AND is_active = true;

-- 3. broker_subscriptions_safe
DROP VIEW IF EXISTS public.broker_subscriptions_safe;
CREATE VIEW public.broker_subscriptions_safe 
WITH (security_invoker = true) AS
SELECT id, user_id, tier, status, starts_at, expires_at, trial_ends_at, created_at, updated_at, ai_credits_used, ai_credits_limit, pdf_downloads, selected_addons
FROM broker_subscriptions;

-- 4. contact_gating_submissions_secure
DROP VIEW IF EXISTS public.contact_gating_submissions_secure;
CREATE VIEW public.contact_gating_submissions_secure 
WITH (security_invoker = true) AS
SELECT id, full_name,
    CASE WHEN email IS NOT NULL THEN email ELSE 'encrypted'::text END AS email_masked,
    CASE WHEN phone IS NOT NULL THEN phone ELSE 'encrypted'::text END AS phone_masked,
    nationality, location, service_interest, preferred_language, session_id, email_verified, phone_verified, created_at
FROM contact_gating_submissions;

-- 5. crm_leads_secure
DROP VIEW IF EXISTS public.crm_leads_secure;
CREATE VIEW public.crm_leads_secure 
WITH (security_invoker = true) AS
SELECT id, full_name, source, pipeline_stage, assigned_broker_id, created_at, updated_at, rental_budget_min, rental_budget_max, rental_preferred_areas, rental_property_type, tags
FROM crm_leads;

-- 6. crm_vip_leads
DROP VIEW IF EXISTS public.crm_vip_leads;
CREATE VIEW public.crm_vip_leads 
WITH (security_invoker = true) AS
SELECT id, full_name, source, pipeline_stage, assigned_broker_id, created_at, updated_at, rental_budget_min, rental_budget_max, rental_preferred_areas, rental_property_type, tags
FROM crm_leads
WHERE vip = true;

-- 7. developer_sales_reps_public
DROP VIEW IF EXISTS public.developer_sales_reps_public;
CREATE VIEW public.developer_sales_reps_public 
WITH (security_invoker = true) AS
SELECT id, developer_id, full_name, title,
    CASE WHEN phone_e164 IS NOT NULL THEN '****' || right(phone_e164, 4) ELSE NULL::text END AS phone_masked,
    CASE WHEN email IS NOT NULL THEN '***@' || split_part(email, '@', 2) ELSE NULL::text END AS email_masked,
    is_primary, is_active, created_at
FROM developer_sales_reps
WHERE is_active = true;

-- 8. employee_payment_history_safe
DROP VIEW IF EXISTS public.employee_payment_history_safe;
CREATE VIEW public.employee_payment_history_safe 
WITH (security_invoker = true) AS
SELECT id, user_id, employee_name, payment_date, payment_type,
    CASE WHEN payment_method IS NULL OR length(payment_method) < 4 THEN '****'::text ELSE repeat('*', length(payment_method) - 4) || right(payment_method, 4) END AS payment_method,
    CASE WHEN reference_number IS NULL OR length(reference_number) < 4 THEN '****'::text ELSE left(reference_number, 3) || repeat('*', GREATEST(length(reference_number) - 6, 2)) || right(reference_number, 3) END AS reference_number,
    amount, currency, status, description, period_start, period_end, created_at
FROM employee_payment_history;

-- 9. employee_salaries_masked
DROP VIEW IF EXISTS public.employee_salaries_masked;
CREATE VIEW public.employee_salaries_masked 
WITH (security_invoker = true) AS
SELECT id, user_id, employee_name, department, base_salary, currency, salary_type, effective_date, end_date, notes, created_at, updated_at, created_by,
    CASE WHEN bank_account_number IS NOT NULL THEN '****' || right(bank_account_number, 4) ELSE NULL::text END AS bank_account_masked,
    CASE WHEN bank_iban IS NOT NULL THEN left(bank_iban, 4) || '****' || right(bank_iban, 4) ELSE NULL::text END AS bank_iban_masked,
    bank_name
FROM employee_salaries;

-- 10. employee_salaries_secure
DROP VIEW IF EXISTS public.employee_salaries_secure;
CREATE VIEW public.employee_salaries_secure 
WITH (security_invoker = true) AS
SELECT id, user_id, employee_name, department, base_salary, currency, salary_type, effective_date, end_date, notes, created_at, updated_at, created_by, bank_name
FROM employee_salaries;

-- 11. executive_communications_audit
DROP VIEW IF EXISTS public.executive_communications_audit;
CREATE VIEW public.executive_communications_audit 
WITH (security_invoker = true) AS
SELECT id, user_id, channel, direction, contact_identifier, contact_name, subject, status, flagged_reason, confidence_score, handled_by, phone_line, created_at, responded_at
FROM executive_communications;

-- 12. hr_employees_secure
DROP VIEW IF EXISTS public.hr_employees_secure;
CREATE VIEW public.hr_employees_secure 
WITH (security_invoker = true) AS
SELECT id, user_id, full_name, department, position, employee_status, start_date, created_at, updated_at
FROM hr_employees;

-- 13. jbj_leads_secure
DROP VIEW IF EXISTS public.jbj_leads_secure;
CREATE VIEW public.jbj_leads_secure 
WITH (security_invoker = true) AS
SELECT id, name, source, status, assigned_broker_id, created_at, updated_at
FROM jbj_leads;

-- 14. leads_secure
DROP VIEW IF EXISTS public.leads_secure;
CREATE VIEW public.leads_secure 
WITH (security_invoker = true) AS
SELECT id, full_name, source, status, created_at, updated_at
FROM leads;

-- 15. partner_bank_vault_masked
DROP VIEW IF EXISTS public.partner_bank_vault_masked;
CREATE VIEW public.partner_bank_vault_masked 
WITH (security_invoker = true) AS
SELECT id, partner_id, bank_name, created_at, updated_at, created_by, updated_by,
    CASE WHEN bank_account_number IS NOT NULL THEN '****' || right(bank_account_number, 4) ELSE NULL::text END AS account_masked,
    CASE WHEN bank_iban IS NOT NULL THEN left(bank_iban, 4) || '****' || right(bank_iban, 4) ELSE NULL::text END AS iban_masked
FROM referral_partner_bank_vault;

-- 16. profiles_public
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT id, full_name, user_role
FROM profiles
WHERE user_role IS NOT NULL;

-- 17. referral_partner_bank_vault_secure
DROP VIEW IF EXISTS public.referral_partner_bank_vault_secure;
CREATE VIEW public.referral_partner_bank_vault_secure 
WITH (security_invoker = true) AS
SELECT id, partner_id, bank_name, created_at, updated_at
FROM referral_partner_bank_vault;

-- 18. referral_partners_safe
DROP VIEW IF EXISTS public.referral_partners_safe;
CREATE VIEW public.referral_partners_safe 
WITH (security_invoker = true) AS
SELECT id, user_id, full_name, partner_type, status, total_referrals, total_conversions, total_earnings_aed, created_at
FROM referral_partners;

-- 19. rental_listings_public (corrected columns)
DROP VIEW IF EXISTS public.rental_listings_public;
CREATE VIEW public.rental_listings_public 
WITH (security_invoker = true) AS
SELECT id, property_title, property_type, description, annual_rent, emirate, community, building_name, address, bedrooms, bathrooms, size_sqft, amenities, images, video_url, status, furnished, payment_terms, created_at
FROM rental_listings
WHERE status = 'live';

-- 20. seller_listings_secure
DROP VIEW IF EXISTS public.seller_listings_secure;
CREATE VIEW public.seller_listings_secure 
WITH (security_invoker = true) AS
SELECT id, user_id, property_type, status, target_selling_price, created_at, updated_at
FROM seller_listings;

-- 21. uae_developers_public (corrected columns)
DROP VIEW IF EXISTS public.uae_developers_public;
CREATE VIEW public.uae_developers_public 
WITH (security_invoker = true) AS
SELECT id, name, slug, logo_url, description, headquarters, founded_year, website_url, is_active
FROM uae_developers
WHERE is_active = true;

-- 22. unified_listing_approvals
DROP VIEW IF EXISTS public.unified_listing_approvals;
CREATE VIEW public.unified_listing_approvals 
WITH (security_invoker = true) AS
SELECT id, listing_type, title, status, created_at, reviewed_at
FROM (
    SELECT id, 'rental' as listing_type, property_title as title, status, created_at, NULL::timestamptz as reviewed_at FROM rental_listings
    UNION ALL
    SELECT id, 'sale' as listing_type, property_type as title, status, created_at, NULL::timestamptz as reviewed_at FROM seller_listings
) combined;

-- Grant appropriate permissions
GRANT SELECT ON public.best_idea_submissions_safe TO authenticated;
GRANT SELECT ON public.broker_profiles_public TO anon, authenticated;
GRANT SELECT ON public.broker_subscriptions_safe TO authenticated;
GRANT SELECT ON public.contact_gating_submissions_secure TO authenticated;
GRANT SELECT ON public.crm_leads_secure TO authenticated;
GRANT SELECT ON public.crm_vip_leads TO authenticated;
GRANT SELECT ON public.developer_sales_reps_public TO anon, authenticated;
GRANT SELECT ON public.employee_payment_history_safe TO authenticated;
GRANT SELECT ON public.employee_salaries_masked TO authenticated;
GRANT SELECT ON public.employee_salaries_secure TO authenticated;
GRANT SELECT ON public.executive_communications_audit TO authenticated;
GRANT SELECT ON public.hr_employees_secure TO authenticated;
GRANT SELECT ON public.jbj_leads_secure TO authenticated;
GRANT SELECT ON public.leads_secure TO authenticated;
GRANT SELECT ON public.partner_bank_vault_masked TO authenticated;
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.referral_partner_bank_vault_secure TO authenticated;
GRANT SELECT ON public.referral_partners_safe TO authenticated;
GRANT SELECT ON public.rental_listings_public TO anon, authenticated;
GRANT SELECT ON public.seller_listings_secure TO authenticated;
GRANT SELECT ON public.uae_developers_public TO anon, authenticated;
GRANT SELECT ON public.unified_listing_approvals TO authenticated;