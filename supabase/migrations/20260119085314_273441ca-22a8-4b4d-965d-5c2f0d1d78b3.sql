-- Update broker_subscriptions_safe to include trial_ends_at
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
    trial_ends_at,
    created_at,
    updated_at,
    ai_credits_used,
    ai_credits_limit,
    pdf_downloads,
    selected_addons
FROM public.broker_subscriptions;