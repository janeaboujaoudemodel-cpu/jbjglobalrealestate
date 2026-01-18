-- Strengthen crm_leads RLS policies to include assignment check and prevent unauthorized access

-- Drop existing policies
DROP POLICY IF EXISTS "crm_leads_secure_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_secure_update" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_secure_delete" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_secure_insert" ON public.crm_leads;

-- SELECT: Users can only see leads they own, created, or are assigned to
CREATE POLICY "crm_leads_strict_select"
ON public.crm_leads
FOR SELECT
USING (
  -- Admins/owners can see all
  has_role(auth.uid(), 'owner'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  -- CRM admins can see all (includes sales directors)
  OR is_crm_admin(auth.uid())
  -- Owner of the lead
  OR owner_user_id = auth.uid()
  -- Creator of the lead
  OR created_by_user_id = auth.uid()
  -- Assigned to this lead (active assignment only)
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments cla
    WHERE cla.lead_id = crm_leads.id
    AND cla.assigned_to_user_id = auth.uid()
    AND cla.unassigned_at IS NULL
  )
);

-- INSERT: Only active CRM members can insert leads
CREATE POLICY "crm_leads_strict_insert"
ON public.crm_leads
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
  -- Must set themselves as creator
  AND created_by_user_id = auth.uid()
);

-- UPDATE: Only lead owners, creators, assignees, or admins
CREATE POLICY "crm_leads_strict_update"
ON public.crm_leads
FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_crm_admin(auth.uid())
  OR owner_user_id = auth.uid()
  OR created_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments cla
    WHERE cla.lead_id = crm_leads.id
    AND cla.assigned_to_user_id = auth.uid()
    AND cla.unassigned_at IS NULL
  )
)
WITH CHECK (
  -- Prevent reassigning owner_user_id to someone else (only admins can)
  (owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR is_crm_admin(auth.uid()))
);

-- DELETE: Only admins/owners can delete leads
CREATE POLICY "crm_leads_strict_delete"
ON public.crm_leads
FOR DELETE
USING (
  has_role(auth.uid(), 'owner'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_crm_admin(auth.uid())
);

-- Also secure the leads table (different from crm_leads)
DROP POLICY IF EXISTS "Anyone can view leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;

-- Leads table is for public form submissions - restrict SELECT to staff only
CREATE POLICY "Only staff can view leads"
ON public.leads
FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_crm_admin(auth.uid())
  OR is_active_crm_member(auth.uid())
);

-- Public can insert leads (with validation)
CREATE POLICY "Public insert leads with validation"
ON public.leads
FOR INSERT
WITH CHECK (
  email IS NOT NULL
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT is_email_domain_blocked(email)
  -- Rate limit: max 3 submissions per email per hour
  AND (
    SELECT COUNT(*) FROM public.leads l
    WHERE l.email = leads.email
    AND l.created_at > NOW() - INTERVAL '1 hour'
  ) < 3
);

-- Only admins can update/delete leads
CREATE POLICY "Only admins update leads"
ON public.leads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Only admins delete leads"
ON public.leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));