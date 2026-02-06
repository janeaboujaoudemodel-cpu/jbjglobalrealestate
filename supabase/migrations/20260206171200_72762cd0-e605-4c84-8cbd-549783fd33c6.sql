
-- =========================================
-- P0 FIX 2: hr_candidates
-- Remove service_role USING (true) bypass
-- Fix public role policy to authenticated only
-- =========================================

-- Drop the permissive service_role policy
DROP POLICY IF EXISTS hr_candidates_service_role ON public.hr_candidates;

-- Drop the public role select policy (security risk - potential anonymous access)
DROP POLICY IF EXISTS hr_candidates_owner_select ON public.hr_candidates;

-- Add comment documenting the fix
COMMENT ON TABLE public.hr_candidates IS 
'HR candidate records. FORCE RLS enabled. Service role must respect RLS. Access restricted to owner/admin roles and self-view only. No anonymous access.';
