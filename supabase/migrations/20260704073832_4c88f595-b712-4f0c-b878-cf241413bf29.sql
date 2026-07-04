-- Fix public resale listings view: switch from security_invoker to definer (barrier)
-- so anon/authenticated can read active listings via the view without needing
-- direct SELECT on the base table (which is locked down by RLS to owners/admins).

DROP VIEW IF EXISTS public.resale_listings_public;

CREATE VIEW public.resale_listings_public
WITH (security_invoker = off, security_barrier = on) AS
SELECT id, title, description, location, area_name, emirate, property_type, bedrooms,
       size_sqft, asking_price, currency, developer_name, project_name,
       handover_status, images, status, created_at, updated_at
FROM public.resale_listings
WHERE status = 'active';

GRANT SELECT ON public.resale_listings_public TO anon;
GRANT SELECT ON public.resale_listings_public TO authenticated;