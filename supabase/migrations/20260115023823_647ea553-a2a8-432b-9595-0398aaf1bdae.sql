-- Fix security definer view issue by dropping and recreating with proper security
DROP VIEW IF EXISTS public.jbj_leads_secure;

-- Create the view as a regular view (not security definer)
-- RLS will be enforced through the underlying table
CREATE VIEW public.jbj_leads_secure AS
SELECT 
  id,
  SPLIT_PART(name, ' ', 1) AS first_name,
  CASE WHEN assigned_broker_id IS NOT NULL THEN '***' || RIGHT(phone, 4) ELSE NULL END AS masked_phone,
  CASE WHEN assigned_broker_id IS NOT NULL THEN SPLIT_PART(email, '@', 1) || '@***' ELSE NULL END AS masked_email,
  status,
  assigned_broker_id,
  property_interest,
  budget_range,
  source,
  last_contact,
  created_at,
  updated_at
FROM public.jbj_leads;

-- Grant appropriate permissions
GRANT SELECT ON public.jbj_leads_secure TO authenticated;