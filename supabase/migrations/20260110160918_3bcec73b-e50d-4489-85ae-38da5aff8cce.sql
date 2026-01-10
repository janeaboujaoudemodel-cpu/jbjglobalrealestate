-- Security hardening: make OTP verification records non-readable to the public
-- Public users only need INSERT (handled by existing policy), while backend functions use service role.

-- Remove overly-permissive policies
DROP POLICY IF EXISTS "email_verifications_select_own" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_update_own" ON public.email_verifications;

-- Allow only owner/admin to read OTP records (for troubleshooting only)
CREATE POLICY "email_verifications_admin_select"
ON public.email_verifications
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Allow only owner/admin to update OTP records (normal flow uses service role)
CREATE POLICY "email_verifications_admin_update"
ON public.email_verifications
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);