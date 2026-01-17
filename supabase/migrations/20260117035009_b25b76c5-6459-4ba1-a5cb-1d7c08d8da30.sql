-- ================================================
-- SECURITY CONSOLIDATION: Reduce redundant RLS policies
-- ================================================

-- ================================
-- 1. CONSOLIDATE ai_brokers (4 → 1 policy)
-- ================================
DROP POLICY IF EXISTS "Admins can manage AI brokers" ON public.ai_brokers;
DROP POLICY IF EXISTS "CRM admins can manage AI brokers" ON public.ai_brokers;
DROP POLICY IF EXISTS "CRM admins can manage ai_brokers" ON public.ai_brokers;
DROP POLICY IF EXISTS "CRM admins can view AI brokers" ON public.ai_brokers;

CREATE POLICY "ai_brokers_admin_all"
ON public.ai_brokers FOR ALL
TO authenticated
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

-- ================================
-- 2. CONSOLIDATE hr_applications (26 → 5 policies)
-- ================================
-- Drop all redundant policies
DROP POLICY IF EXISTS "Admins can manage hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Admins can view hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Applicants can insert own applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Applicants can update own applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admin update applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admin view applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admins can update hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admins can view all hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR can view applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Sales directors can view hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Users can insert own hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Users can view own hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_admin_select" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_admin_update" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_authenticated_insert" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_hr_insert" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_hr_select" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_insert_own" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_public_insert_validated" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_select_admin_only" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_select_own" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_update_admin_only" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_update_own" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_apps_insert_public" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_apps_select_hr" ON public.hr_applications;

-- Create consolidated policies
CREATE POLICY "hr_apps_admin_all"
ON public.hr_applications FOR ALL
TO authenticated
USING (
  is_hr_admin(auth.uid()) OR 
  is_hr_manager(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  is_hr_admin(auth.uid()) OR 
  is_hr_manager(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "hr_apps_own_select"
ON public.hr_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "hr_apps_own_update"
ON public.hr_applications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending'::hr_application_status)
WITH CHECK (auth.uid() = user_id AND status = 'pending'::hr_application_status);

CREATE POLICY "hr_apps_authenticated_insert"
ON public.hr_applications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "hr_apps_service_role_insert"
ON public.hr_applications FOR INSERT
TO service_role
WITH CHECK (true);

-- ================================
-- 3. CONSOLIDATE crm_leads (19 → 5 policies)
-- ================================
DROP POLICY IF EXISTS "CRM admins can manage leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can update accessible leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can view accessible leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Direct CRM leads access restricted" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_admin_delete" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_broker_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_broker_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_broker_update" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete_admin_only" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete_auth" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_insert_auth" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_sales_director_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_sales_director_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_sales_director_update" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_select_auth" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_service_role_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_staff_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_staff_update" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_update_auth" ON public.crm_leads;

-- Create consolidated policies
CREATE POLICY "crm_leads_admin_all"
ON public.crm_leads FOR ALL
TO authenticated
USING (
  is_crm_admin(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  is_crm_admin(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "crm_leads_member_select"
ON public.crm_leads FOR SELECT
TO authenticated
USING (
  is_active_crm_member(auth.uid()) AND (
    owner_user_id = auth.uid() OR
    created_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM crm_lead_assignments
      WHERE lead_id = crm_leads.id
        AND assigned_to_user_id = auth.uid()
        AND unassigned_at IS NULL
    )
  )
);

CREATE POLICY "crm_leads_member_update"
ON public.crm_leads FOR UPDATE
TO authenticated
USING (
  is_active_crm_member(auth.uid()) AND (
    owner_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM crm_lead_assignments
      WHERE lead_id = crm_leads.id
        AND assigned_to_user_id = auth.uid()
        AND unassigned_at IS NULL
    )
  )
)
WITH CHECK (
  is_active_crm_member(auth.uid()) AND (
    owner_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM crm_lead_assignments
      WHERE lead_id = crm_leads.id
        AND assigned_to_user_id = auth.uid()
        AND unassigned_at IS NULL
    )
  )
);

CREATE POLICY "crm_leads_member_insert"
ON public.crm_leads FOR INSERT
TO authenticated
WITH CHECK (is_active_crm_member(auth.uid()));

CREATE POLICY "crm_leads_service_insert"
ON public.crm_leads FOR INSERT
TO service_role
WITH CHECK (true);