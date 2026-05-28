GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_call_logs TO authenticated;
GRANT ALL ON public.broker_call_logs TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.broker_activity_stats TO authenticated;
GRANT ALL ON public.broker_activity_stats TO service_role;

GRANT SELECT, INSERT ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;