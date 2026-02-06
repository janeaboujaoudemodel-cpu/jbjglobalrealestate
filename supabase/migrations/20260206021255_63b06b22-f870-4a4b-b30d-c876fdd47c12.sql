-- Authenticated staff can read (but PII is encrypted)
-- Fix: Use correct crm_role enum values
CREATE POLICY "Authenticated staff can read encrypted data"
ON public.contact_gating_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'hr_admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND crm_role IN ('admin', 'owner_admin', 'founder', 'sales_director')
  )
);

-- Comment explaining the security model
COMMENT ON TABLE public.contact_gating_submissions IS 
'Contact gating submissions with encrypted PII. All writes must go through submit-contact-gating edge function. Plaintext columns contain [ENCRYPTED] placeholder - real data is in *_encrypted columns.';