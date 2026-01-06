-- Enable realtime for function_rate_limits table
ALTER TABLE public.function_rate_limits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.function_rate_limits;