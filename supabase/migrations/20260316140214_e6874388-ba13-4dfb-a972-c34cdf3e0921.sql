
-- FIX 1: Drop broad CRM chat read policy
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON public.crm_chat_messages;

-- FIX 2: Fix hr_certificates public exposure
DROP POLICY IF EXISTS "Anyone can verify certificates by token" ON public.hr_certificates;
DROP POLICY IF EXISTS "hr_certificates_owner_admin_read" ON public.hr_certificates;

CREATE POLICY "hr_certificates_owner_admin_read" ON public.hr_certificates
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

CREATE OR REPLACE FUNCTION public.verify_certificate_by_token(p_token text)
RETURNS TABLE (
  full_name text,
  certificate_number text,
  track text,
  issued_at timestamptz,
  is_valid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    full_name,
    certificate_number,
    track,
    issued_at,
    true as is_valid
  FROM public.hr_certificates
  WHERE verification_token = p_token
    AND is_revoked = false
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate_by_token(text) TO anon, authenticated;

-- FIX 3: Drop old public INSERT policies
DROP POLICY IF EXISTS "Service role inserts checklist runs" ON public.security_checklist_runs;
DROP POLICY IF EXISTS "Service role inserts backup records" ON public.system_backup_records;

-- FIX 4: Make profile-pictures bucket private
UPDATE storage.buckets SET public = false WHERE id = 'profile-pictures';

-- FIX 5: CRM role escalation - restrict to authenticated
DROP POLICY IF EXISTS "crm_users_profile_update_own" ON public.crm_users_profile;

CREATE POLICY "crm_users_profile_update_own" ON public.crm_users_profile
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
