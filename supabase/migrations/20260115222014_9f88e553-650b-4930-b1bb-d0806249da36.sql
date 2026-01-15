-- Drop all existing policies on vapi_call_logs to start fresh
DROP POLICY IF EXISTS "Admins can manage call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can manage vapi_call_logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can update call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can view all call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can view call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can view vapi_call_logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "CRM admin manage call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "CRM admin view call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "System can insert call logs with validation" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_admin_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_admin_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_insert_admin" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_select_admin_only" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_logs_admin_only" ON public.vapi_call_logs;

-- Revoke all public/anon access
REVOKE ALL ON public.vapi_call_logs FROM anon;
REVOKE ALL ON public.vapi_call_logs FROM public;

-- Ensure RLS is enabled
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only admins and owners can view ALL call logs
CREATE POLICY "vapi_owner_admin_full_access"
ON public.vapi_call_logs
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- Policy 2: Assigned brokers can only view call logs for their assigned leads
CREATE POLICY "vapi_assigned_broker_select"
ON public.vapi_call_logs
FOR SELECT
TO authenticated
USING (
  -- User is directly assigned to this lead
  EXISTS (
    SELECT 1 FROM public.crm_lead_assignments cla
    WHERE cla.lead_id = vapi_call_logs.lead_id
      AND cla.assigned_to_user_id = auth.uid()
      AND cla.unassigned_at IS NULL
  )
  OR
  -- User owns the lead
  EXISTS (
    SELECT 1 FROM public.crm_leads cl
    WHERE cl.id = vapi_call_logs.lead_id
      AND cl.owner_user_id = auth.uid()
  )
);

-- Policy 3: Service role insert for webhooks (no anon access)
-- Edge functions use service role which bypasses RLS