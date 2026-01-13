-- =============================================
-- COMPREHENSIVE SECURITY FIX: RLS POLICIES
-- =============================================

-- 1. REVOKE PUBLIC ACCESS FROM SENSITIVE TABLES
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.broker_profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.crm_leads FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.assistant_contacts FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.assistant_communications FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.hr_applications FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.hr_candidates FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.hr_employees FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.referral_partners FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.referral_leads FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.seller_listings FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.vapi_call_logs FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.memberships FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.developer_sales_reps FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.executive_communications FROM anon;

-- 2. ENABLE RLS ON ALL TABLES
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_communications ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Users can view own broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can update own broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Admins can manage all broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "CRM admins can view all leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can view assigned leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM admins can manage leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can view own assistant_contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can manage own assistant_contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can view own assistant_communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can manage own assistant_communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Admins can view hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Admins can manage hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Admins can view hr_candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "Admins can manage hr_candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "Admins can view hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Admins can manage hr_employees" ON public.hr_employees;
DROP POLICY IF EXISTS "Users can view own referral_partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Admins can manage referral_partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Partners can view own referral_leads" ON public.referral_leads;
DROP POLICY IF EXISTS "Admins can manage referral_leads" ON public.referral_leads;
DROP POLICY IF EXISTS "Users can view own seller_listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can manage own seller_listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Admins can manage seller_listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Admins can view vapi_call_logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can manage vapi_call_logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can view chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can manage chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "CRM users can view developer_sales_reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "Admins can manage developer_sales_reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "Users can view own executive_communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can manage own executive_communications" ON public.executive_communications;

-- 4. CREATE NEW SECURE RLS POLICIES

-- BROKER PROFILES
CREATE POLICY "Users can view own broker_profiles" ON public.broker_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can update own broker_profiles" ON public.broker_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all broker_profiles" ON public.broker_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- PROFILES
CREATE POLICY "Users can view own profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can update own profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- CRM LEADS
CREATE POLICY "CRM admins can view all leads" ON public.crm_leads
  FOR SELECT TO authenticated
  USING (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "CRM admins can manage leads" ON public.crm_leads
  FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- ASSISTANT CONTACTS
CREATE POLICY "Users can view own assistant_contacts" ON public.assistant_contacts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own assistant_contacts" ON public.assistant_contacts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ASSISTANT COMMUNICATIONS
CREATE POLICY "Users can view own assistant_communications" ON public.assistant_communications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own assistant_communications" ON public.assistant_communications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- HR TABLES
CREATE POLICY "Admins can view hr_applications" ON public.hr_applications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can manage hr_applications" ON public.hr_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can view hr_candidates" ON public.hr_candidates
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can manage hr_candidates" ON public.hr_candidates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can view hr_employees" ON public.hr_employees
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can manage hr_employees" ON public.hr_employees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- REFERRAL PARTNERS
CREATE POLICY "Users can view own referral_partners" ON public.referral_partners
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage referral_partners" ON public.referral_partners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- REFERRAL LEADS
CREATE POLICY "Partners can view own referral_leads" ON public.referral_leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.referral_partners rp 
      WHERE rp.id = referral_partner_id AND rp.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage referral_leads" ON public.referral_leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- SELLER LISTINGS
CREATE POLICY "Users can view own seller_listings" ON public.seller_listings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own seller_listings" ON public.seller_listings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage seller_listings" ON public.seller_listings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- VAPI CALL LOGS
CREATE POLICY "Admins can view vapi_call_logs" ON public.vapi_call_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can manage vapi_call_logs" ON public.vapi_call_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- CHAT CONVERSATIONS
CREATE POLICY "Admins can view chat_conversations" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can manage chat_conversations" ON public.chat_conversations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- MEMBERSHIPS
CREATE POLICY "Users can view own memberships" ON public.memberships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- DEVELOPER SALES REPS
CREATE POLICY "CRM users can view developer_sales_reps" ON public.developer_sales_reps
  FOR SELECT TO authenticated
  USING (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage developer_sales_reps" ON public.developer_sales_reps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- EXECUTIVE COMMUNICATIONS
CREATE POLICY "Users can view own executive_communications" ON public.executive_communications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own executive_communications" ON public.executive_communications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- 5. SECURE VIEWS (use correct column name 'vip' not 'is_vip')
DROP VIEW IF EXISTS public.broker_subscriptions_safe;
CREATE VIEW public.broker_subscriptions_safe 
WITH (security_invoker = true)
AS SELECT 
  id, user_id, tier, status, email, full_name, company_name,
  created_at, updated_at, starts_at, expires_at, trial_ends_at,
  ai_credits_used, ai_credits_limit, pdf_downloads, selected_addons,
  currency, user_role, rera_number
FROM public.broker_subscriptions;

REVOKE ALL ON public.broker_subscriptions_safe FROM anon;
GRANT SELECT ON public.broker_subscriptions_safe TO authenticated;

DROP VIEW IF EXISTS public.crm_vip_leads;
CREATE VIEW public.crm_vip_leads
WITH (security_invoker = true)
AS SELECT * FROM public.crm_leads WHERE vip = true;

REVOKE ALL ON public.crm_vip_leads FROM anon;
GRANT SELECT ON public.crm_vip_leads TO authenticated;