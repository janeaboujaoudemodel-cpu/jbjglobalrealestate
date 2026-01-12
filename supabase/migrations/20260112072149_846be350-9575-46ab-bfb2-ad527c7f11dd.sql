-- Fix: Remove public-role policies that expose leads data
-- These policies allow unauthenticated access to SELECT
DROP POLICY IF EXISTS "leads_admin_select" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_update" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_delete" ON public.leads;

-- Remove duplicate/redundant policies on leads
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_admin_only" ON public.leads;
DROP POLICY IF EXISTS "leads_select_admin_only" ON public.leads;
DROP POLICY IF EXISTS "leads_update_admin_only" ON public.leads;

-- Keep validated insert policies for public lead capture
-- (leads_insert_validated, leads_public_insert_secure, Validated public lead insertion)

-- Create single consolidated authenticated-only policies for leads
CREATE POLICY "leads_authenticated_select"
ON public.leads FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR 
  is_crm_admin(auth.uid())
);

CREATE POLICY "leads_authenticated_update"
ON public.leads FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR 
  is_crm_admin(auth.uid())
);

CREATE POLICY "leads_authenticated_delete"
ON public.leads FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR 
  is_crm_admin(auth.uid())
);