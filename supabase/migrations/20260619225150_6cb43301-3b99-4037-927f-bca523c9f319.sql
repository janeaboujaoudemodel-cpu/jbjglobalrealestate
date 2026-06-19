DROP VIEW IF EXISTS public.dld_daily_snapshot_latest;
CREATE VIEW public.dld_daily_snapshot_latest
  WITH (security_invoker = true) AS
  SELECT * FROM public.dld_daily_snapshot
  ORDER BY snapshot_date DESC
  LIMIT 1;
GRANT SELECT ON public.dld_daily_snapshot_latest TO anon, authenticated;