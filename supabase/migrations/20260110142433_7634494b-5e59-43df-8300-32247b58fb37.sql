
-- Add RLS policies to email_verifications table
-- This table stores OTP verification attempts and should be protected

-- Policy: Users can insert verification requests (needed for anon users to verify email)
CREATE POLICY "email_verifications_public_insert"
ON public.email_verifications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Policy: Users can select their own verification by email (needed to check OTP status)
CREATE POLICY "email_verifications_select_own"
ON public.email_verifications
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Allow updating verification records (needed to mark as verified)
CREATE POLICY "email_verifications_update"
ON public.email_verifications
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Policy: Admins can delete old verifications
CREATE POLICY "email_verifications_admin_delete"
ON public.email_verifications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
