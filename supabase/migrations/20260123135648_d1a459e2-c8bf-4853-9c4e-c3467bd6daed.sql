-- Tighten RLS policies on vapi_call_logs table
-- This table contains sensitive call transcripts, recordings, and extracted customer PII

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Strict call log access" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_select_authorized" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_update_admin" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_delete_admin" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_logs_admin_insert" ON public.vapi_call_logs;

-- Ensure RLS is enabled
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Only senior staff (owner_admin, founder) and the lead owner can view call logs
-- Removed: admin, sales_director, crm_admin, reviewed_by, and assigned brokers from general access
-- This is sensitive PII data - need strict access
CREATE POLICY "vapi_call_logs_select_strict"
ON public.vapi_call_logs
FOR SELECT
TO authenticated
USING (
  -- Only owner/admin roles at app level
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  -- Only founder and owner_admin CRM roles (strictest tier)
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.is_active = true
    AND cup.crm_role IN ('owner_admin', 'founder')
  )
  -- Lead owner can view their own lead's call logs
  OR EXISTS (
    SELECT 1 FROM public.crm_leads cl
    WHERE cl.id = vapi_call_logs.lead_id
    AND cl.owner_user_id = auth.uid()
  )
);

-- INSERT: Only service role (via edge functions) or strict admins
CREATE POLICY "vapi_call_logs_insert_strict"
ON public.vapi_call_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- UPDATE: Only senior staff can update (e.g., for reviews, flagging)
CREATE POLICY "vapi_call_logs_update_strict"
ON public.vapi_call_logs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.is_active = true
    AND cup.crm_role IN ('owner_admin', 'founder')
  )
);

-- DELETE: Only owners can delete call logs (audit trail)
CREATE POLICY "vapi_call_logs_delete_strict"
ON public.vapi_call_logs
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Add service role policy for edge function operations
CREATE POLICY "vapi_call_logs_service_role"
ON public.vapi_call_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);