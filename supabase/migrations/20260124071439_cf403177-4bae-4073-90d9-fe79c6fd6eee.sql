-- SECURITY FIX: Remove overly permissive staff policies on leads table
-- The is_authorized_staff() function is too broad - it allows any CRM member to see all leads

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "leads_staff_select" ON public.leads;
DROP POLICY IF EXISTS "staff_view_leads" ON public.leads;
DROP POLICY IF EXISTS "leads_staff_update" ON public.leads;
DROP POLICY IF EXISTS "staff_update_leads" ON public.leads;

-- The leads_select_restricted policy is actually well-designed:
-- - Admins/owners can see all leads
-- - CRM members can only see leads they created, own, or are assigned to
-- This is the correct behavior - keep it as the sole SELECT policy

-- Ensure the UPDATE policy also follows the same restricted pattern
DROP POLICY IF EXISTS "leads_update_restricted" ON public.leads;

CREATE POLICY "leads_update_restricted" ON public.leads
FOR UPDATE
USING (
  -- Admins and owners can update any lead
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR 
  is_crm_admin(auth.uid()) OR
  -- CRM members can only update leads they're associated with
  (
    is_active_crm_member(auth.uid()) AND (
      -- Created the lead
      EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text 
        AND cl.created_by_user_id = auth.uid()
      ) OR
      -- Owns the lead
      EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text 
        AND cl.owner_user_id = auth.uid()
      ) OR
      -- Is assigned to the lead
      EXISTS (
        SELECT 1 FROM crm_lead_assignments cla
        WHERE cla.lead_id::text = leads.id::text 
        AND cla.assigned_to_user_id = auth.uid()
        AND cla.unassigned_at IS NULL
      )
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR 
  is_crm_admin(auth.uid()) OR
  (
    is_active_crm_member(auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text 
        AND cl.created_by_user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM crm_leads cl
        WHERE cl.id::text = leads.id::text 
        AND cl.owner_user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM crm_lead_assignments cla
        WHERE cla.lead_id::text = leads.id::text 
        AND cla.assigned_to_user_id = auth.uid()
        AND cla.unassigned_at IS NULL
      )
    )
  )
);