
-- =========================================================================
-- BACKEND AUDIT FIX v2 - Corrected column names
-- =========================================================================

-- 1. Fix duplicate log_security_event functions - drop the old one
DROP FUNCTION IF EXISTS public.log_security_event(text, text, text, boolean, text, jsonb);

-- 2. Fix vip_clients RLS (has user_id column)
DROP POLICY IF EXISTS "Users can view own VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "Admins can view all VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "CRM users can view VIP clients" ON public.vip_clients;

CREATE POLICY "Users can view own VIP clients"
ON public.vip_clients FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all VIP clients"
ON public.vip_clients FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "CRM users can view VIP clients"
ON public.vip_clients FOR SELECT
TO authenticated
USING (
  public.is_crm_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert VIP clients" ON public.vip_clients;
CREATE POLICY "Users can insert VIP clients"
ON public.vip_clients FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Fix vapi_call_logs RLS (NO user_id - use lead_id relationship or admin access)
DROP POLICY IF EXISTS "Users can view own call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can view all call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "CRM users can view call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Users can insert call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "System can insert call logs" ON public.vapi_call_logs;

-- Allow CRM users and admins to view call logs
CREATE POLICY "CRM and admin access to call logs"
ON public.vapi_call_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.is_crm_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Allow system inserts (for webhook)
CREATE POLICY "System can insert call logs"
ON public.vapi_call_logs FOR INSERT
WITH CHECK (true);

-- Allow CRM users to update call logs
DROP POLICY IF EXISTS "CRM users can update call logs" ON public.vapi_call_logs;
CREATE POLICY "CRM users can update call logs"
ON public.vapi_call_logs FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.is_crm_admin(auth.uid())
);

-- 4. Consolidate executive_communications policies (too many duplicates)
DROP POLICY IF EXISTS "exec_comms_owner_only" ON public.executive_communications;
DROP POLICY IF EXISTS "exec_comms_select_own" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_insert_own" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_own" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_own_insert" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_own_select" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_own_update" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_select_own_or_admin" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_update_own" ON public.executive_communications;
DROP POLICY IF EXISTS "Owner only access to communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can insert own exec communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can update own exec communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can view own exec communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can view own executive_communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can manage own executive_communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Executives view own communications only" ON public.executive_communications;
DROP POLICY IF EXISTS "Only owners can update executive communications" ON public.executive_communications;

-- Create clean, consolidated policies
CREATE POLICY "exec_comms_select"
ON public.executive_communications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "exec_comms_insert"
ON public.executive_communications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "exec_comms_update"
ON public.executive_communications FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "exec_comms_delete"
ON public.executive_communications FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'::app_role));

-- 5. Fix referral_partner_banking SELECT policy
DROP POLICY IF EXISTS "Partners can view own banking" ON public.referral_partner_banking;
DROP POLICY IF EXISTS "Admins can view all banking" ON public.referral_partner_banking;

CREATE POLICY "Partners can view own banking"
ON public.referral_partner_banking FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.referral_partners rp
    WHERE rp.id = referral_partner_banking.partner_id
    AND rp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all banking"
ON public.referral_partner_banking FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
);
