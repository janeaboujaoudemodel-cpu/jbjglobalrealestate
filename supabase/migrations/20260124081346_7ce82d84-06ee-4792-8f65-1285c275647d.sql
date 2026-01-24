
-- Add explicit deny policy for anonymous access to vip_clients
-- This provides defense-in-depth even though RLS already blocks anon by default

CREATE POLICY "deny_anonymous_access" 
ON public.vip_clients
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add comment documenting the security controls
COMMENT ON TABLE public.vip_clients IS 'VIP client data protected by RLS. Anonymous access explicitly denied. Only owners, sales directors, and relationship managers can access based on role/ownership.';
