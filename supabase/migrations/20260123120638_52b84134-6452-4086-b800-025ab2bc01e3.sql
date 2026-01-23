-- ============================================
-- COMPREHENSIVE SECURITY LOCKDOWN - Part 2
-- Continue from where we left off
-- ============================================

-- Drop remaining problematic policies
DROP POLICY IF EXISTS "leads_staff_select" ON public.leads;
DROP POLICY IF EXISTS "leads_rate_limited_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_staff_update" ON public.leads;
DROP POLICY IF EXISTS "leads_owner_delete" ON public.leads;

-- Recreate leads policies (clean)
CREATE POLICY "leads_staff_select"
ON public.leads FOR SELECT
TO authenticated
USING (public.is_authorized_staff());

CREATE POLICY "leads_rate_limited_insert"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (public.check_lead_rate_limit(email, 3, 24));

CREATE POLICY "leads_staff_update"
ON public.leads FOR UPDATE
TO authenticated
USING (public.is_authorized_staff());

CREATE POLICY "leads_owner_delete"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));