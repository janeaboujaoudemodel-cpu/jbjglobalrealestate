-- ============================================
-- Phase 3 P1: developer_sales_reps policy hardening
-- ============================================

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage developer_sales_reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "Admins can manage sales reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "Admins can view sales reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "Authorized staff can view sales reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "CRM users can view developer_sales_reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "CRM users can view sales reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "dev_sales_reps_admin_all" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_active_select" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_admin_insert" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_admin_update" ON public.developer_sales_reps;

-- Step 2: Create consolidated policies (authenticated only)
CREATE POLICY "dev_sales_reps_select" ON public.developer_sales_reps
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'owner'::app_role) OR
    is_crm_admin(auth.uid()) OR
    is_active_crm_member(auth.uid()) OR
    is_listing_admin(auth.uid())
  );

CREATE POLICY "dev_sales_reps_insert" ON public.developer_sales_reps
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'owner'::app_role) OR
    is_crm_admin(auth.uid()) OR
    is_listing_admin(auth.uid())
  );

CREATE POLICY "dev_sales_reps_update" ON public.developer_sales_reps
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'owner'::app_role) OR
    is_crm_admin(auth.uid()) OR
    is_listing_admin(auth.uid())
  );

CREATE POLICY "dev_sales_reps_delete" ON public.developer_sales_reps
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'owner'::app_role)
  );

-- Step 3: Enable FORCE RLS
ALTER TABLE public.developer_sales_reps FORCE ROW LEVEL SECURITY;