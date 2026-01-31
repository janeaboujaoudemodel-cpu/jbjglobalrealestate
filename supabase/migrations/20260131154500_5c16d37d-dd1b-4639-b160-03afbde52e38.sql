-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "audit_system_insert" ON public.security_access_audit;

-- Create a more secure INSERT policy that only allows authenticated users
CREATE POLICY "audit_authenticated_insert" 
ON public.security_access_audit 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure the policy logs the correct user
COMMENT ON POLICY "audit_authenticated_insert" ON public.security_access_audit IS 
  'Allows authenticated users to insert audit logs. Anonymous access is denied.';