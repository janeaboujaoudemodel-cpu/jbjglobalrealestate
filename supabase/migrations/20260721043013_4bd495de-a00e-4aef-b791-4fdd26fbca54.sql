CREATE OR REPLACE FUNCTION public.count_truly_updated_brokers()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.crm_brokers
  WHERE updated_at IS NOT NULL
    AND created_at IS NOT NULL
    AND updated_at > created_at + interval '5 seconds';
$$;

GRANT EXECUTE ON FUNCTION public.count_truly_updated_brokers() TO authenticated, service_role;