
-- Fix email_verifications UPDATE policy to be more restrictive
-- Users should only update records matching their email session
DROP POLICY IF EXISTS "email_verifications_update" ON public.email_verifications;

CREATE POLICY "email_verifications_update_own"
ON public.email_verifications
FOR UPDATE
TO anon, authenticated
USING (
  -- Only allow updating recent, unverified records
  verified_at IS NULL 
  AND expires_at > now()
  AND attempts < 5
)
WITH CHECK (
  verified_at IS NULL 
  AND expires_at > now()
  AND attempts < 5
);
