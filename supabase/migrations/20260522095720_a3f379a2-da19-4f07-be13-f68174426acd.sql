ALTER TABLE public.crm_brokers
ADD COLUMN IF NOT EXISTS activation_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_brokers_activation_verified_at
ON public.crm_brokers (activation_verified_at)
WHERE activation_verified_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.crm_broker_auto_expire_invites()
RETURNS TABLE(expired_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Broker invitations are now valid until they are used, resent, revoked, or blocked.
  -- This prevents active broker activation links from being invalidated while a broker is unavailable.
  RETURN QUERY SELECT 0::integer;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_broker_auto_expire_invites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_broker_auto_expire_invites() TO service_role;