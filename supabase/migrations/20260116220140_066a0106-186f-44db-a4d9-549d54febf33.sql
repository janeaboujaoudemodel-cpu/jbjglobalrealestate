-- =====================================================
-- SECURITY HARDENING PART 2 - Remaining tables
-- =====================================================

-- 7) REFERRAL_LEADS - Fixed column name: referral_partner_id
DROP POLICY IF EXISTS "referral_leads_partner_select" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_partner_insert" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_select_policy" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_insert_policy" ON public.referral_leads;

ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_leads_partner_select"
ON public.referral_leads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.referral_partners rp 
    WHERE rp.id = referral_leads.referral_partner_id 
    AND rp.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "referral_leads_partner_insert"
ON public.referral_leads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.referral_partners rp 
    WHERE rp.id = referral_partner_id 
    AND rp.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 11) PROFILES - Users see own, admins see all
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_system_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_select"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "profiles_own_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_system_insert"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 12) MEMBERSHIPS - Users see own, admins see all
DROP POLICY IF EXISTS "memberships_own_select" ON public.memberships;
DROP POLICY IF EXISTS "memberships_own_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_admin_update" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_policy" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert_policy" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_policy" ON public.memberships;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.memberships;

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_own_select"
ON public.memberships FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "memberships_own_insert"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "memberships_admin_update"
ON public.memberships FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 13) BROKER_SUBSCRIPTIONS - Brokers see own, admins see all
DROP POLICY IF EXISTS "broker_subscriptions_own_select" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_own_insert" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_admin_update" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select_policy" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_insert_policy" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_update_policy" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.broker_subscriptions;

ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_subscriptions_own_select"
ON public.broker_subscriptions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "broker_subscriptions_own_insert"
ON public.broker_subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "broker_subscriptions_admin_update"
ON public.broker_subscriptions FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 14) ASSISTANT_CONTACTS - Users see own only
DROP POLICY IF EXISTS "assistant_contacts_own_select" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own_insert" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own_update" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own_delete" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_select_policy" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_insert_policy" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_update_policy" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_delete_policy" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.assistant_contacts;

ALTER TABLE public.assistant_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_contacts_own_select"
ON public.assistant_contacts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "assistant_contacts_own_insert"
ON public.assistant_contacts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "assistant_contacts_own_update"
ON public.assistant_contacts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "assistant_contacts_own_delete"
ON public.assistant_contacts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 15) ASSISTANT_COMMUNICATIONS - Users see own only
DROP POLICY IF EXISTS "assistant_communications_own_select" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_own_insert" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_own_update" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_select_policy" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_insert_policy" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_update_policy" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can manage their own communications" ON public.assistant_communications;

ALTER TABLE public.assistant_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_communications_own_select"
ON public.assistant_communications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "assistant_communications_own_insert"
ON public.assistant_communications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "assistant_communications_own_update"
ON public.assistant_communications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 16) EXECUTIVE_COMMUNICATIONS - Executives see own only
DROP POLICY IF EXISTS "executive_communications_own_select" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_own_insert" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_own_update" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_select_policy" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_insert_policy" ON public.executive_communications;

ALTER TABLE public.executive_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "executive_communications_own_select"
ON public.executive_communications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "executive_communications_own_insert"
ON public.executive_communications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "executive_communications_own_update"
ON public.executive_communications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 17) EXECUTIVE_FINANCIAL_TRANSACTIONS - Executives see own only
DROP POLICY IF EXISTS "executive_financial_transactions_own_select" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "executive_financial_transactions_own_insert" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "executive_financial_transactions_select_policy" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "executive_financial_transactions_insert_policy" ON public.executive_financial_transactions;

ALTER TABLE public.executive_financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "executive_financial_transactions_own_select"
ON public.executive_financial_transactions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "executive_financial_transactions_own_insert"
ON public.executive_financial_transactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 18) CRM_LEADS - CRM staff only with proper access control
DROP POLICY IF EXISTS "crm_leads_public_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_staff_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_staff_update" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_admin_delete" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_select_policy" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_insert_policy" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_update_policy" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can view leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can insert leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can update leads" ON public.crm_leads;

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_leads_public_insert"
ON public.crm_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "crm_leads_staff_select"
ON public.crm_leads FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.is_crm_admin(auth.uid())
  OR public.can_access_crm_lead(auth.uid(), id)
);

CREATE POLICY "crm_leads_staff_update"
ON public.crm_leads FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.is_crm_admin(auth.uid())
  OR public.can_access_crm_lead(auth.uid(), id)
);

CREATE POLICY "crm_leads_admin_delete"
ON public.crm_leads FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.is_crm_admin(auth.uid())
);

-- 19) BROKER_PROFILES - Only active public profiles visible
DROP POLICY IF EXISTS "broker_profiles_public_select" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_own_insert" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_own_update" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_select_policy" ON public.broker_profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.broker_profiles;

ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_profiles_public_select"
ON public.broker_profiles FOR SELECT
TO anon, authenticated
USING (
  (is_public = true AND is_active = true)
  OR user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "broker_profiles_own_insert"
ON public.broker_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "broker_profiles_own_update"
ON public.broker_profiles FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 20) DEVELOPER_SALES_REPS - Only active reps visible
DROP POLICY IF EXISTS "developer_sales_reps_active_select" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_admin_insert" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_admin_update" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_select_policy" ON public.developer_sales_reps;

ALTER TABLE public.developer_sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer_sales_reps_active_select"
ON public.developer_sales_reps FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  OR public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.is_listing_admin(auth.uid())
);

CREATE POLICY "developer_sales_reps_admin_insert"
ON public.developer_sales_reps FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.is_listing_admin(auth.uid())
);

CREATE POLICY "developer_sales_reps_admin_update"
ON public.developer_sales_reps FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.is_listing_admin(auth.uid())
);

-- 21) JBJ_LEAD_ACCESS_LOG - Restrict to admins viewing, brokers inserting
DROP POLICY IF EXISTS "jbj_lead_access_log_broker_insert" ON public.jbj_lead_access_log;
DROP POLICY IF EXISTS "jbj_lead_access_log_admin_select" ON public.jbj_lead_access_log;
DROP POLICY IF EXISTS "jbj_lead_access_log_insert_policy" ON public.jbj_lead_access_log;
DROP POLICY IF EXISTS "jbj_lead_access_log_select_policy" ON public.jbj_lead_access_log;

ALTER TABLE public.jbj_lead_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jbj_lead_access_log_broker_insert"
ON public.jbj_lead_access_log FOR INSERT
TO authenticated
WITH CHECK (broker_id IS NOT NULL);

CREATE POLICY "jbj_lead_access_log_admin_select"
ON public.jbj_lead_access_log FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role)
);