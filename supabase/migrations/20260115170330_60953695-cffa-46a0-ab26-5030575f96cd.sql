-- =====================================================
-- COMPREHENSIVE SECURITY FIX: Restrict all PII tables
-- =====================================================

-- 1. Fix profiles table - remove public role policies
DROP POLICY IF EXISTS "profiles_select_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_secure" ON public.profiles;

-- 2. Fix chat_conversations - admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_update" ON public.chat_conversations;

CREATE POLICY "chat_conversations_admin_select"
ON public.chat_conversations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "chat_conversations_admin_insert"
ON public.chat_conversations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "chat_conversations_admin_update"
ON public.chat_conversations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 3. Fix chat_history - admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chat_history;
DROP POLICY IF EXISTS "Anyone can insert chat history" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_select" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_insert" ON public.chat_history;

CREATE POLICY "chat_history_admin_select"
ON public.chat_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "chat_history_admin_insert"
ON public.chat_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 4. Fix leads table - staff only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;

CREATE POLICY "leads_staff_select"
ON public.leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role) OR public.is_crm_admin(auth.uid()));

CREATE POLICY "leads_staff_insert"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role) OR public.is_crm_admin(auth.uid()));

-- 5. Fix evaluation_requests - admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Anyone can insert evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_select" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_insert" ON public.evaluation_requests;

CREATE POLICY "evaluation_requests_admin_select"
ON public.evaluation_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "evaluation_requests_admin_insert"
ON public.evaluation_requests FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 6. Fix vapi_call_logs - admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_insert" ON public.vapi_call_logs;

CREATE POLICY "vapi_call_logs_admin_select"
ON public.vapi_call_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 7. Fix broker_subscriptions - own or admin
DROP POLICY IF EXISTS "Enable read access for all users" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select" ON public.broker_subscriptions;

CREATE POLICY "broker_subscriptions_own_or_admin"
ON public.broker_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 8. Fix memberships - own or admin
DROP POLICY IF EXISTS "Enable read access for all users" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select" ON public.memberships;

CREATE POLICY "memberships_own_or_admin"
ON public.memberships FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 9. Fix hr_applications - HR admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.hr_applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_select" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_insert" ON public.hr_applications;

CREATE POLICY "hr_applications_hr_select"
ON public.hr_applications FOR SELECT TO authenticated
USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "hr_applications_hr_insert"
ON public.hr_applications FOR INSERT TO authenticated
WITH CHECK (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 10. Fix hr_candidates - HR admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_select" ON public.hr_candidates;

CREATE POLICY "hr_candidates_hr_select"
ON public.hr_candidates FOR SELECT TO authenticated
USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 11. Fix seller_listings - own or admin
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_select" ON public.seller_listings;

CREATE POLICY "seller_listings_own_or_admin"
ON public.seller_listings FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_listing_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 12. Fix assistant_contacts - own only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_select" ON public.assistant_contacts;

CREATE POLICY "assistant_contacts_own"
ON public.assistant_contacts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 13. Fix assistant_communications - own only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_select" ON public.assistant_communications;

CREATE POLICY "assistant_communications_own"
ON public.assistant_communications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 14. Fix executive_communications - own only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_select" ON public.executive_communications;

CREATE POLICY "executive_communications_own"
ON public.executive_communications FOR SELECT TO authenticated
USING (auth.uid() = user_id);