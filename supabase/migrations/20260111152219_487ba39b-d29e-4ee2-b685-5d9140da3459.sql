-- =====================================================
-- SECURITY HARDENING: RLS Policies for 14 Critical Tables
-- Restricts PII access to authenticated admins/owners only
-- =====================================================

-- 1. LEADS TABLE
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
CREATE POLICY "Admins can view all leads" ON public.leads
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
CREATE POLICY "Admins can insert leads" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
CREATE POLICY "Admins can update leads" ON public.leads
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads" ON public.leads
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads" ON public.leads
FOR INSERT TO anon
WITH CHECK (true);

-- 2. PROFILES TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. BROKER_SUBSCRIPTIONS TABLE
ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.broker_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.broker_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can update own subscription" ON public.broker_subscriptions;
CREATE POLICY "Users can update own subscription" ON public.broker_subscriptions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.broker_subscriptions;
CREATE POLICY "Users can insert own subscription" ON public.broker_subscriptions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 4. CHAT_CONVERSATIONS TABLE
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
CREATE POLICY "Admins can view all conversations" ON public.chat_conversations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins can manage conversations" ON public.chat_conversations;
CREATE POLICY "Admins can manage conversations" ON public.chat_conversations
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Public can create conversations" ON public.chat_conversations;
CREATE POLICY "Public can create conversations" ON public.chat_conversations
FOR INSERT TO anon
WITH CHECK (true);

-- 5. CRM_LEADS TABLE
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users can view accessible leads" ON public.crm_leads;
CREATE POLICY "CRM users can view accessible leads" ON public.crm_leads
FOR SELECT TO authenticated
USING (
  public.is_crm_admin(auth.uid()) OR 
  owner_user_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner') OR
  EXISTS (
    SELECT 1 FROM public.crm_lead_assignments 
    WHERE lead_id = crm_leads.id 
    AND assigned_to_user_id = auth.uid() 
    AND unassigned_at IS NULL
  )
);

DROP POLICY IF EXISTS "CRM users can insert leads" ON public.crm_leads;
CREATE POLICY "CRM users can insert leads" ON public.crm_leads
FOR INSERT TO authenticated
WITH CHECK (public.is_active_crm_member(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "CRM users can update accessible leads" ON public.crm_leads;
CREATE POLICY "CRM users can update accessible leads" ON public.crm_leads
FOR UPDATE TO authenticated
USING (
  public.is_crm_admin(auth.uid()) OR 
  owner_user_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- 6. CRM_USERS_PROFILE TABLE
ALTER TABLE public.crm_users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own CRM profile" ON public.crm_users_profile;
CREATE POLICY "Users can view own CRM profile" ON public.crm_users_profile
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins can manage CRM profiles" ON public.crm_users_profile;
CREATE POLICY "Admins can manage CRM profiles" ON public.crm_users_profile
FOR ALL TO authenticated
USING (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 7. BROKER_PROFILES TABLE
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own broker profile" ON public.broker_profiles;
CREATE POLICY "Users can view own broker profile" ON public.broker_profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Public can view active public profiles" ON public.broker_profiles;
CREATE POLICY "Public can view active public profiles" ON public.broker_profiles
FOR SELECT TO anon
USING (is_public = true AND is_active = true);

DROP POLICY IF EXISTS "Users can manage own broker profile" ON public.broker_profiles;
CREATE POLICY "Users can manage own broker profile" ON public.broker_profiles
FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 8. BROKER_CONTRACTS TABLE
ALTER TABLE public.broker_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contracts" ON public.broker_contracts;
CREATE POLICY "Users can view own contracts" ON public.broker_contracts
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can create own contracts" ON public.broker_contracts;
CREATE POLICY "Users can create own contracts" ON public.broker_contracts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all contracts" ON public.broker_contracts;
CREATE POLICY "Admins can manage all contracts" ON public.broker_contracts
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 9. DEVELOPER_SALES_REPS TABLE
ALTER TABLE public.developer_sales_reps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sales reps" ON public.developer_sales_reps;
CREATE POLICY "Admins can view sales reps" ON public.developer_sales_reps
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR public.is_active_crm_member(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage sales reps" ON public.developer_sales_reps;
CREATE POLICY "Admins can manage sales reps" ON public.developer_sales_reps
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 10. EMAIL_VERIFICATIONS TABLE
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view verifications" ON public.email_verifications;
CREATE POLICY "Admins can view verifications" ON public.email_verifications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "System can manage verifications" ON public.email_verifications;
CREATE POLICY "System can manage verifications" ON public.email_verifications
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Public can create verifications" ON public.email_verifications;
CREATE POLICY "Public can create verifications" ON public.email_verifications
FOR INSERT TO anon
WITH CHECK (true);

-- 11. BROKER_CALL_LOGS TABLE
ALTER TABLE public.broker_call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own call logs" ON public.broker_call_logs;
CREATE POLICY "Users can view own call logs" ON public.broker_call_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can manage own call logs" ON public.broker_call_logs;
CREATE POLICY "Users can manage own call logs" ON public.broker_call_logs
FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 12. BROKER_CHAT_LOGS TABLE
ALTER TABLE public.broker_chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat logs" ON public.broker_chat_logs;
CREATE POLICY "Users can view own chat logs" ON public.broker_chat_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can manage own chat logs" ON public.broker_chat_logs;
CREATE POLICY "Users can manage own chat logs" ON public.broker_chat_logs
FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 13. REFERRAL_PARTNERS TABLE
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referral data" ON public.referral_partners;
CREATE POLICY "Users can view own referral data" ON public.referral_partners
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Users can manage own referral data" ON public.referral_partners;
CREATE POLICY "Users can manage own referral data" ON public.referral_partners
FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 14. VAPI_CALL_LOGS TABLE
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view call logs" ON public.vapi_call_logs;
CREATE POLICY "Admins can view call logs" ON public.vapi_call_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "System can insert call logs" ON public.vapi_call_logs;
CREATE POLICY "System can insert call logs" ON public.vapi_call_logs
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage call logs" ON public.vapi_call_logs;
CREATE POLICY "Admins can manage call logs" ON public.vapi_call_logs
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));