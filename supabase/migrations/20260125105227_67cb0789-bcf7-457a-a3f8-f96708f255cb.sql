-- =====================================================
-- LEADS TABLE: Secure RLS policies for PII protection
-- =====================================================

-- First, drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Deny anonymous read access to leads" ON public.leads;
DROP POLICY IF EXISTS "leads_authenticated_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_admins_only" ON public.leads;
DROP POLICY IF EXISTS "leads_public_insert_secure" ON public.leads;
DROP POLICY IF EXISTS "leads_public_insert_validated" ON public.leads;
DROP POLICY IF EXISTS "leads_select_restricted" ON public.leads;
DROP POLICY IF EXISTS "leads_staff_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update_restricted" ON public.leads;
DROP POLICY IF EXISTS "rate_limited_insert_leads" ON public.leads;

-- Ensure RLS is enabled and forced
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- =====================================================
-- SELECT POLICIES: Strict access control
-- =====================================================

-- 1. Explicitly DENY anonymous users from reading ANY leads
CREATE POLICY "leads_deny_anon_select"
ON public.leads FOR SELECT
TO anon
USING (false);

-- 2. Authenticated users: Only admins, owners, CRM admins, or assigned users
CREATE POLICY "leads_select_authorized"
ON public.leads FOR SELECT
TO authenticated
USING (
  -- Admins and owners can see all
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.is_crm_admin(auth.uid())
  OR (
    -- CRM members can only see leads they created, own, or are assigned to
    public.is_active_crm_member(auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text
        AND cl.created_by_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text
        AND cl.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM crm_lead_assignments cla
        WHERE cla.lead_id::text = leads.id::text
        AND cla.assigned_to_user_id = auth.uid()
        AND cla.unassigned_at IS NULL
      )
    )
  )
);

-- =====================================================
-- INSERT POLICIES: Public form submissions with rate limiting
-- =====================================================

-- 1. Anonymous users: Rate-limited, validated public form submissions only
CREATE POLICY "leads_insert_anon_validated"
ON public.leads FOR INSERT
TO anon
WITH CHECK (
  -- Must have valid email
  email IS NOT NULL
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Email not blocked
  AND NOT public.is_email_domain_blocked(email)
  -- Must be from allowed sources
  AND source = ANY(ARRAY['website', 'contact_form', 'landing_page', 'referral', 'chat', 'whatsapp', 'homepage', 'market_report', 'property-evaluation'])
  -- Honeypot check (anti-bot)
  AND (honeypot IS NULL OR honeypot = '')
  -- Rate limiting: max 3 per email per 24 hours
  AND public.check_lead_rate_limit(email, 3, 24)
);

-- 2. Authenticated users: Admins/owners/CRM admins can insert
CREATE POLICY "leads_insert_staff"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.is_crm_admin(auth.uid())
);

-- =====================================================
-- UPDATE POLICIES: Only authorized staff or assigned users
-- =====================================================

CREATE POLICY "leads_update_authorized"
ON public.leads FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.is_crm_admin(auth.uid())
  OR (
    public.is_active_crm_member(auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text
        AND cl.created_by_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text
        AND cl.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM crm_lead_assignments cla
        WHERE cla.lead_id::text = leads.id::text
        AND cla.assigned_to_user_id = auth.uid()
        AND cla.unassigned_at IS NULL
      )
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.is_crm_admin(auth.uid())
  OR (
    public.is_active_crm_member(auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text
        AND cl.created_by_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text
        AND cl.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM crm_lead_assignments cla
        WHERE cla.lead_id::text = leads.id::text
        AND cla.assigned_to_user_id = auth.uid()
        AND cla.unassigned_at IS NULL
      )
    )
  )
);

-- =====================================================
-- DELETE POLICIES: Only admins/owners
-- =====================================================

CREATE POLICY "leads_delete_admins"
ON public.leads FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);