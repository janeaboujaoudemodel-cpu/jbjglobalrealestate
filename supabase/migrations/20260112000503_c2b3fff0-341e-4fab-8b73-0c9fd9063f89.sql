-- Fix SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.crm_vip_leads;
CREATE VIEW public.crm_vip_leads 
WITH (security_invoker = true)
AS SELECT * FROM public.crm_leads WHERE vip = true;