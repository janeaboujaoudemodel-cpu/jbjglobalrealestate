-- Fix the RLS policy to be more restrictive - only service role should access these tables
DROP POLICY IF EXISTS "Service role can manage email verifications" ON public.email_verifications;

-- No public policies needed - only service role (edge functions) should access this table
-- The RLS is enabled but with no public policies, only service role can access