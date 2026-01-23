-- Tighten RLS policies on hr_candidates table
-- This table contains sensitive PII: names, emails, phones, CV URLs

-- Drop all existing overlapping policies
DROP POLICY IF EXISTS "Admins can manage hr_candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "Admins can read HR candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "Admins can view hr_candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR admins can delete candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR staff can insert candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR staff can update candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "HR staff can view candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_admin_select" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_delete_admin_only" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_hr_or_admin_select" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_hr_select" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_insert_admin_only" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_select_admin_only" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_update_admin_only" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_user_select" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_cands_select_hr" ON public.hr_candidates;

-- Ensure RLS is enabled
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;

-- SELECT: Strict need-to-know access
-- Only: owners, admins, founder/owner_admin CRM roles, or the candidate themselves
CREATE POLICY "hr_candidates_select_strict"
ON public.hr_candidates
FOR SELECT
TO authenticated
USING (
  -- App-level owner/admin roles
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  -- Senior HR roles only (founder, owner_admin)
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.is_active = true
    AND cup.crm_role IN ('owner_admin', 'founder')
  )
  -- Candidate can view their own record
  OR user_id = auth.uid()
);

-- INSERT: Only senior staff can add candidates
CREATE POLICY "hr_candidates_insert_strict"
ON public.hr_candidates
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.is_active = true
    AND cup.crm_role IN ('owner_admin', 'founder')
  )
);

-- UPDATE: Only senior staff can update candidates
CREATE POLICY "hr_candidates_update_strict"
ON public.hr_candidates
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.is_active = true
    AND cup.crm_role IN ('owner_admin', 'founder')
  )
);

-- DELETE: Only owners can delete (audit trail preservation)
CREATE POLICY "hr_candidates_delete_strict"
ON public.hr_candidates
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Service role for edge function operations
CREATE POLICY "hr_candidates_service_role"
ON public.hr_candidates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);