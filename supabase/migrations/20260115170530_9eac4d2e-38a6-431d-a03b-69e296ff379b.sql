-- =====================================================
-- COMPREHENSIVE SECURITY FIX: Remove ALL public/anon role policies
-- =====================================================

-- 1. chat_conversations - remove all public/anon policies
DROP POLICY IF EXISTS "Validated public conversation creation" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_admin_select_secure" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_admin_update_secure" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_insert_public" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_public_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_public_insert_validated" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_validated_insert" ON public.chat_conversations;

-- 2. chat_history - remove public role policies
DROP POLICY IF EXISTS "Founders can update chat flags" ON public.chat_history;
DROP POLICY IF EXISTS "Insert chat history with session" ON public.chat_history;
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;

-- 3. crm_leads - remove public role policies, keep authenticated only
DROP POLICY IF EXISTS "crm_leads_admin_limited_manage" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_admin_limited_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_insert_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_select_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_update_secure" ON public.crm_leads;

-- Now create authenticated-only versions

-- chat_conversations - admin only for select/update, but allow public insert for chat widget
CREATE POLICY "chat_conv_select_admin"
ON public.chat_conversations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "chat_conv_update_admin"
ON public.chat_conversations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- For chat widget, we need anon insert but validated
CREATE POLICY "chat_conv_insert_validated"
ON public.chat_conversations FOR INSERT TO anon, authenticated
WITH CHECK (user_email IS NOT NULL AND length(user_email) > 0);

-- chat_history - admin for select, allow insert for chat
CREATE POLICY "chat_hist_select_admin"
ON public.chat_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role) OR auth.uid() = user_id);

CREATE POLICY "chat_hist_insert_session"
ON public.chat_history FOR INSERT TO anon, authenticated
WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "chat_hist_update_founder"
ON public.chat_history FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- crm_leads - CRM users only, no public access
CREATE POLICY "crm_leads_select_auth"
ON public.crm_leads FOR SELECT TO authenticated
USING (
  public.is_crm_admin(auth.uid()) 
  OR owner_user_id = auth.uid() 
  OR created_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments 
    WHERE lead_id = crm_leads.id 
    AND assigned_to_user_id = auth.uid() 
    AND unassigned_at IS NULL
  )
);

CREATE POLICY "crm_leads_insert_auth"
ON public.crm_leads FOR INSERT TO authenticated
WITH CHECK (public.is_active_crm_member(auth.uid()));

CREATE POLICY "crm_leads_update_auth"
ON public.crm_leads FOR UPDATE TO authenticated
USING (
  public.is_crm_admin(auth.uid()) 
  OR owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments 
    WHERE lead_id = crm_leads.id 
    AND assigned_to_user_id = auth.uid() 
    AND unassigned_at IS NULL
  )
);

CREATE POLICY "crm_leads_delete_auth"
ON public.crm_leads FOR DELETE TO authenticated
USING (public.is_crm_admin(auth.uid()));

-- vapi_call_logs - admin only
DROP POLICY IF EXISTS "vapi_logs_select_secure" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_admin_only_select" ON public.vapi_call_logs;
CREATE POLICY "vapi_logs_admin_only"
ON public.vapi_call_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- hr_applications - HR admin only, but allow public insert for applicants
DROP POLICY IF EXISTS "hr_apps_select_secure" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_insert_public" ON public.hr_applications;
CREATE POLICY "hr_apps_select_hr"
ON public.hr_applications FOR SELECT TO authenticated
USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "hr_apps_insert_public"
ON public.hr_applications FOR INSERT TO anon, authenticated
WITH CHECK (email IS NOT NULL AND full_name IS NOT NULL);

-- hr_candidates - HR admin only
DROP POLICY IF EXISTS "hr_candidates_select_secure" ON public.hr_candidates;
CREATE POLICY "hr_cands_select_hr"
ON public.hr_candidates FOR SELECT TO authenticated
USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- seller_listings - owner or listing admin only
DROP POLICY IF EXISTS "seller_listings_select_secure" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can view own seller listings" ON public.seller_listings;
CREATE POLICY "seller_listings_select_auth"
ON public.seller_listings FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_listing_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- broker_subscriptions - own or admin only
DROP POLICY IF EXISTS "broker_subs_select_secure" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.broker_subscriptions;
CREATE POLICY "broker_subs_select_auth"
ON public.broker_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- referral_partners - own or admin only
DROP POLICY IF EXISTS "referral_partners_select_secure" ON public.referral_partners;
DROP POLICY IF EXISTS "Partners can view own data" ON public.referral_partners;
CREATE POLICY "referral_partners_select_auth"
ON public.referral_partners FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- assistant_communications - own only
DROP POLICY IF EXISTS "assistant_comms_select_secure" ON public.assistant_communications;
CREATE POLICY "assistant_comms_select_own"
ON public.assistant_communications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- executive_communications - own only
DROP POLICY IF EXISTS "exec_comms_select_secure" ON public.executive_communications;
CREATE POLICY "exec_comms_select_own"
ON public.executive_communications FOR SELECT TO authenticated
USING (auth.uid() = user_id);