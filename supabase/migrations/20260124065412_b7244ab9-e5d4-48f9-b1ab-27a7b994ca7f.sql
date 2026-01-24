-- Fix leads table RLS: Restrict access to only leads user owns/is assigned to
-- Drop redundant and overly permissive policies

DROP POLICY IF EXISTS "Authorized staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Only authorized staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "leads_authenticated_select" ON public.leads;

-- Drop redundant update policies
DROP POLICY IF EXISTS "Authorized staff can update leads" ON public.leads;
DROP POLICY IF EXISTS "Only authorized staff can update leads" ON public.leads;
DROP POLICY IF EXISTS "leads_authenticated_update" ON public.leads;

-- Drop redundant delete policies
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "admin_delete_leads" ON public.leads;
DROP POLICY IF EXISTS "leads_authenticated_delete" ON public.leads;
DROP POLICY IF EXISTS "leads_owner_delete" ON public.leads;

-- Drop redundant insert policies (keep only the most secure ones)
DROP POLICY IF EXISTS "Strict lead submission rate limit" ON public.leads;
DROP POLICY IF EXISTS "Validated public lead insertion" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_validated" ON public.leads;
DROP POLICY IF EXISTS "Only backend can insert leads" ON public.leads;
DROP POLICY IF EXISTS "leads_rate_limited_insert" ON public.leads;

-- Create consolidated, secure policies

-- SELECT: Admins/owners see all, CRM members only see leads they own or are assigned to
CREATE POLICY "leads_select_restricted" ON public.leads
FOR SELECT TO authenticated
USING (
  -- Admins and owners can see all leads
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid()) OR
  -- Regular CRM members can only see leads they created, own, or are assigned to
  (
    is_active_crm_member(auth.uid()) AND (
      -- They created the lead (check crm_leads for created_by_user_id)
      EXISTS (
        SELECT 1 FROM crm_leads cl 
        WHERE cl.id::text = leads.id::text 
        AND cl.created_by_user_id = auth.uid()
      ) OR
      -- They own the lead
      EXISTS (
        SELECT 1 FROM crm_leads cl 
        WHERE cl.id::text = leads.id::text 
        AND cl.owner_user_id = auth.uid()
      ) OR
      -- They are assigned to the lead
      EXISTS (
        SELECT 1 FROM crm_lead_assignments cla 
        WHERE cla.lead_id::text = leads.id::text 
        AND cla.assigned_to_user_id = auth.uid()
        AND cla.unassigned_at IS NULL
      )
    )
  )
);

-- UPDATE: Only admins/owners or assigned brokers can update
CREATE POLICY "leads_update_restricted" ON public.leads
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);

-- DELETE: Only admins and owners
CREATE POLICY "leads_delete_admins_only" ON public.leads
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- INSERT: Keep the secure public insert with honeypot, rate limiting, and domain blocking
-- Only allow public lead submission through validated channels
CREATE POLICY "leads_public_insert_validated" ON public.leads
FOR INSERT TO anon
WITH CHECK (
  email IS NOT NULL AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  NOT is_email_domain_blocked(email) AND
  source = ANY (ARRAY['website', 'contact_form', 'landing_page', 'referral', 'chat', 'whatsapp', 'market_report', 'property-evaluation']) AND
  (honeypot IS NULL OR honeypot = '') AND
  check_lead_rate_limit(email, 3, 24)
);

-- INSERT for authenticated (admins only, not regular staff)
CREATE POLICY "leads_authenticated_insert" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);