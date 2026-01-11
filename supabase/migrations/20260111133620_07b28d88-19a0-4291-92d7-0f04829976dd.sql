-- Fix OTP Verification Tables Security
-- Remove overly permissive policies that allow direct client access

-- Drop permissive policies on email_verifications
DROP POLICY IF EXISTS "Service can insert verifications" ON email_verifications;
DROP POLICY IF EXISTS "Service can update verifications" ON email_verifications;

-- Drop permissive policies on phone_verifications
DROP POLICY IF EXISTS "Service can insert phone verifications" ON phone_verifications;
DROP POLICY IF EXISTS "Service can update phone verifications" ON phone_verifications;

-- Keep admin-only SELECT for monitoring (already exists per memory, but ensure it's there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_verifications' 
    AND policyname = 'Admins can view email verifications'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view email verifications" ON email_verifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''owner''))';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'phone_verifications' 
    AND policyname = 'Admins can view phone verifications'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view phone verifications" ON phone_verifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''owner''))';
  END IF;
END $$;