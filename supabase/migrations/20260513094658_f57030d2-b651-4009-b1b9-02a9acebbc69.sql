
DROP VIEW IF EXISTS public.vw_resale_with_source;
CREATE VIEW public.vw_resale_with_source
  WITH (security_invoker = true)
AS
SELECT
  r.*,
  CASE r.source_entity_type
    WHEN 'developer'  THEN 'Developer Registry'
    WHEN 'brokerage'  THEN 'Brokerage Agency'
    WHEN 'broker'     THEN 'Individual Broker'
    WHEN 'direct'     THEN 'Direct Investor'
    ELSE 'Unknown'
  END AS source_label
FROM public.resale_listings r;
