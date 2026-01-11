-- ===========================================
-- 1. ADD VIP COLUMN TO CRM_LEADS (if not already added)
-- ===========================================

-- Note: is_vip column may already exist from partial migration
-- This is idempotent

-- ===========================================
-- 2. FIX LEADS TABLE RLS - Drop existing policies first
-- ===========================================

DROP POLICY IF EXISTS "leads_admin_select" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_update" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_delete" ON public.leads;
DROP POLICY IF EXISTS "leads_public_insert_secure" ON public.leads;

-- Recreate secure policies for leads
CREATE POLICY "leads_public_insert_secure" ON public.leads
FOR INSERT WITH CHECK (
  email IS NOT NULL 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND source IN ('website', 'contact_form', 'landing_page', 'referral', 'chat', 'whatsapp', 'homepage', 'market_report', 'property-evaluation')
  AND NOT public.is_email_domain_blocked(email)
  AND (honeypot IS NULL OR honeypot = '')
);

CREATE POLICY "leads_admin_select" ON public.leads
FOR SELECT USING (
  public.is_owner_or_admin(auth.uid())
  OR public.is_crm_admin(auth.uid())
);

CREATE POLICY "leads_admin_update" ON public.leads
FOR UPDATE USING (
  public.is_owner_or_admin(auth.uid())
  OR public.is_crm_admin(auth.uid())
);

CREATE POLICY "leads_admin_delete" ON public.leads
FOR DELETE USING (
  public.is_owner_or_admin(auth.uid())
  OR public.is_crm_admin(auth.uid())
);

-- ===========================================
-- 3. FIX CRM_LEADS TABLE RLS
-- ===========================================

DROP POLICY IF EXISTS "crm_leads_select_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_insert_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_update_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete_secure" ON public.crm_leads;

-- Secure SELECT: CRM admins see all, brokers see only their own/assigned
CREATE POLICY "crm_leads_select_secure" ON public.crm_leads
FOR SELECT USING (
  public.is_crm_admin(auth.uid())
  OR owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments
    WHERE lead_id = id 
    AND assigned_to_user_id = auth.uid()
    AND unassigned_at IS NULL
  )
);

-- INSERT: Active CRM members can create leads
CREATE POLICY "crm_leads_insert_secure" ON public.crm_leads
FOR INSERT WITH CHECK (
  public.is_active_crm_member(auth.uid())
);

-- UPDATE: CRM admins or lead owners can update
CREATE POLICY "crm_leads_update_secure" ON public.crm_leads
FOR UPDATE USING (
  public.is_crm_admin(auth.uid())
  OR owner_user_id = auth.uid()
);

-- DELETE: Only CRM admins can delete
CREATE POLICY "crm_leads_delete_secure" ON public.crm_leads
FOR DELETE USING (
  public.is_crm_admin(auth.uid())
);

-- ===========================================
-- 4. FIX PROFILES TABLE RLS
-- ===========================================

DROP POLICY IF EXISTS "profiles_select_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_secure" ON public.profiles;

CREATE POLICY "profiles_select_secure" ON public.profiles
FOR SELECT USING (
  id = auth.uid() 
  OR public.is_owner_or_admin(auth.uid())
);

CREATE POLICY "profiles_update_secure" ON public.profiles
FOR UPDATE USING (
  id = auth.uid()
);

-- ===========================================
-- 5. FIX CHAT_CONVERSATIONS TABLE RLS
-- ===========================================

DROP POLICY IF EXISTS "chat_public_insert_secure" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_admin_select_secure" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_admin_update_secure" ON public.chat_conversations;

-- Public can create chat conversations (for customer support)
CREATE POLICY "chat_public_insert_secure" ON public.chat_conversations
FOR INSERT WITH CHECK (true);

-- Only admins can view chat conversations
CREATE POLICY "chat_admin_select_secure" ON public.chat_conversations
FOR SELECT USING (
  public.is_owner_or_admin(auth.uid())
);

CREATE POLICY "chat_admin_update_secure" ON public.chat_conversations
FOR UPDATE USING (
  public.is_owner_or_admin(auth.uid())
);

-- ===========================================
-- 6. FIX EVALUATION_REQUESTS TABLE RLS
-- ===========================================

DROP POLICY IF EXISTS "evaluation_public_insert" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_admin_select" ON public.evaluation_requests;

-- Public can request evaluations
CREATE POLICY "evaluation_public_insert" ON public.evaluation_requests
FOR INSERT WITH CHECK (true);

-- Only admins can view
CREATE POLICY "evaluation_admin_select" ON public.evaluation_requests
FOR SELECT USING (
  public.is_owner_or_admin(auth.uid())
);

-- ===========================================
-- 7. FIX VAPI_CALL_LOGS TABLE RLS
-- ===========================================

DROP POLICY IF EXISTS "vapi_public_insert" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_admin_select" ON public.vapi_call_logs;

-- Public insert for webhook calls
CREATE POLICY "vapi_public_insert" ON public.vapi_call_logs
FOR INSERT WITH CHECK (true);

-- Only admins can view call logs
CREATE POLICY "vapi_admin_select" ON public.vapi_call_logs
FOR SELECT USING (
  public.is_owner_or_admin(auth.uid())
);

-- ===========================================
-- 8. FIX HR_APPLICATIONS TABLE RLS
-- ===========================================

DROP POLICY IF EXISTS "hr_applications_public_insert" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_admin_select" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_admin_update" ON public.hr_applications;

-- Public can submit applications
CREATE POLICY "hr_applications_public_insert" ON public.hr_applications
FOR INSERT WITH CHECK (true);

-- Only HR admins can view
CREATE POLICY "hr_applications_admin_select" ON public.hr_applications
FOR SELECT USING (
  public.is_owner_or_admin(auth.uid())
  OR public.is_hr_admin(auth.uid())
);

CREATE POLICY "hr_applications_admin_update" ON public.hr_applications
FOR UPDATE USING (
  public.is_owner_or_admin(auth.uid())
  OR public.is_hr_admin(auth.uid())
);

-- ===========================================
-- 9. FIX BROKER_SUBSCRIPTIONS TABLE RLS
-- ===========================================

DROP POLICY IF EXISTS "broker_subs_user_select" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subs_user_update" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subs_user_insert" ON public.broker_subscriptions;

-- Users can only view their own subscription
CREATE POLICY "broker_subs_user_select" ON public.broker_subscriptions
FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_owner_or_admin(auth.uid())
);

-- Users can update their own subscription
CREATE POLICY "broker_subs_user_update" ON public.broker_subscriptions
FOR UPDATE USING (
  user_id = auth.uid()
  OR public.is_owner_or_admin(auth.uid())
);

-- Users can insert their own subscription
CREATE POLICY "broker_subs_user_insert" ON public.broker_subscriptions
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);