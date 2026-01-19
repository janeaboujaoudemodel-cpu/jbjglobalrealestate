-- Clean up overlapping vapi_call_logs policies - consolidate for clarity
-- Drop redundant policies
DROP POLICY IF EXISTS "Admins can read VAPI logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "CRM and admin access to call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_assigned_broker_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_admin_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_secure_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_owner_admin_full_access" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_admin_insert" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_service_insert" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "CRM users can update call logs" ON public.vapi_call_logs;

-- Create clean, consolidated policies

-- 1. SELECT: Admins, owners, CRM admins, assigned brokers, or lead owners
CREATE POLICY "vapi_call_logs_select_authorized"
ON public.vapi_call_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_crm_admin(auth.uid())
  OR reviewed_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM crm_lead_assignments cla
    WHERE cla.lead_id = vapi_call_logs.lead_id
      AND cla.assigned_to_user_id = auth.uid()
      AND cla.unassigned_at IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM crm_leads cl
    WHERE cl.id = vapi_call_logs.lead_id
      AND cl.owner_user_id = auth.uid()
  )
);

-- 2. INSERT: Service role only (via edge functions)
CREATE POLICY "vapi_call_logs_insert_service"
ON public.vapi_call_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. UPDATE: Admins and CRM admins only
CREATE POLICY "vapi_call_logs_update_admin"
ON public.vapi_call_logs FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_crm_admin(auth.uid())
);

-- 4. DELETE: Owners and admins only
CREATE POLICY "vapi_call_logs_delete_admin"
ON public.vapi_call_logs FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);