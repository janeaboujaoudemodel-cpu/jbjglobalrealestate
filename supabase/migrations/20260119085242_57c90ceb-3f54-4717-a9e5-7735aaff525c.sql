-- Fix 3: Fix security definer views by recreating with security_invoker

-- Recreate broker_subscriptions_safe view with security_invoker
DROP VIEW IF EXISTS public.broker_subscriptions_safe;
CREATE VIEW public.broker_subscriptions_safe
WITH (security_invoker = on) AS
SELECT 
    id,
    user_id,
    tier,
    status,
    starts_at,
    expires_at,
    created_at,
    updated_at,
    ai_credits_used,
    ai_credits_limit,
    pdf_downloads,
    selected_addons
FROM public.broker_subscriptions;

-- Recreate crm_leads_secure view with security_invoker (using correct columns)
DROP VIEW IF EXISTS public.crm_leads_secure;
CREATE VIEW public.crm_leads_secure
WITH (security_invoker = on) AS
SELECT 
    id,
    full_name,
    source,
    pipeline_stage,
    assigned_broker_id,
    created_at,
    updated_at,
    rental_budget_min,
    rental_budget_max,
    rental_preferred_areas,
    rental_property_type,
    tags
FROM public.crm_leads;

-- Recreate crm_vip_leads view with security_invoker  
DROP VIEW IF EXISTS public.crm_vip_leads;
CREATE VIEW public.crm_vip_leads
WITH (security_invoker = on) AS
SELECT 
    id,
    full_name,
    source,
    pipeline_stage,
    assigned_broker_id,
    created_at,
    updated_at,
    rental_budget_min,
    rental_budget_max,
    rental_preferred_areas,
    rental_property_type,
    tags
FROM public.crm_leads
WHERE vip = true;

-- Recreate uae_developers_public view with security_invoker (using correct columns)
DROP VIEW IF EXISTS public.uae_developers_public;
CREATE VIEW public.uae_developers_public
WITH (security_invoker = on) AS
SELECT 
    id,
    name,
    slug,
    logo_url,
    headquarters,
    location_city,
    location_emirate,
    description,
    website_url,
    founded_year,
    is_active,
    created_at
FROM public.uae_developers
WHERE is_active = true;