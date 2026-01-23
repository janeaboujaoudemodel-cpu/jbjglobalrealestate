-- =====================================================
-- FIX 1: hr_candidates - Protect applicant personal data
-- =====================================================

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Anyone can view hr_candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "Public can view hr_candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR staff can view candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR staff can insert candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR staff can update candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR admins can delete candidates" ON public.hr_candidates;

-- Ensure RLS is enabled
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;

-- SELECT: Only HR admins/managers can view candidates
CREATE POLICY "HR staff can view candidates"
ON public.hr_candidates
FOR SELECT
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

-- INSERT: HR staff can add candidates (also allow public applications via edge function)
CREATE POLICY "HR staff can insert candidates"
ON public.hr_candidates
FOR INSERT
TO authenticated
WITH CHECK (public.is_hr_admin_strict(auth.uid()));

-- UPDATE: Only HR staff
CREATE POLICY "HR staff can update candidates"
ON public.hr_candidates
FOR UPDATE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

-- DELETE: Only HR admins
CREATE POLICY "HR admins can delete candidates"
ON public.hr_candidates
FOR DELETE
TO authenticated
USING (public.is_hr_admin_strict(auth.uid()));

-- =====================================================
-- FIX 2: referral_partner_bank_vault - Protect banking data
-- =====================================================

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Anyone can view bank vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Public can view bank vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can view own banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Admins can view all banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can update own banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Admins can manage banking" ON public.referral_partner_bank_vault;

-- Ensure RLS is enabled
ALTER TABLE public.referral_partner_bank_vault ENABLE ROW LEVEL SECURITY;

-- SELECT: Partners can only view their own, admins/owners can view all
CREATE POLICY "Partners can view own banking"
ON public.referral_partner_bank_vault
FOR SELECT
TO authenticated
USING (
  partner_id IN (SELECT id FROM public.referral_partners WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- INSERT: Only admins/owners can insert
CREATE POLICY "Admins can insert banking"
ON public.referral_partner_bank_vault
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- UPDATE: Partners can update their own, admins can update all
CREATE POLICY "Partners can update own banking"
ON public.referral_partner_bank_vault
FOR UPDATE
TO authenticated
USING (
  partner_id IN (SELECT id FROM public.referral_partners WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- DELETE: Only admins/owners
CREATE POLICY "Admins can delete banking"
ON public.referral_partner_bank_vault
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);