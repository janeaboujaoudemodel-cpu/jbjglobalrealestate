-- Fix security definer view by using security invoker
DROP VIEW IF EXISTS public.uae_developers_public;
CREATE VIEW public.uae_developers_public 
WITH (security_invoker = on) AS
SELECT 
  id, name, slug, logo_url, 
  location_city, location_emirate, description,
  founded_year, headquarters, is_active,
  created_at, updated_at
FROM public.uae_developers
WHERE is_active = true;

-- Grant select on public view to anon for website display
GRANT SELECT ON public.uae_developers_public TO anon, authenticated;

-- Add policy for anon to SELECT from uae_developers (limited to active only)
DROP POLICY IF EXISTS "uae_developers_anon_select_active" ON public.uae_developers;
CREATE POLICY "uae_developers_anon_select_active" ON public.uae_developers
FOR SELECT TO anon
USING (is_active = true);