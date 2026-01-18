
-- ============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- Fixing all identified data exposure issues
-- ============================================

-- 1. FIX: employee_salaries - Restrict to owner/admin only
DROP POLICY IF EXISTS "HR managers and admins can view salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "HR managers and admins can manage salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "Employees can view own salary" ON public.employee_salaries;
DROP POLICY IF EXISTS "employee_salaries_admin_all" ON public.employee_salaries;
DROP POLICY IF EXISTS "employee_salaries_own_select" ON public.employee_salaries;

CREATE POLICY "employee_salaries_secure_select"
ON public.employee_salaries FOR SELECT
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "employee_salaries_secure_manage"
ON public.employee_salaries FOR ALL
USING (
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

-- 2. FIX: executive_communications - Only owner can access their own
DROP POLICY IF EXISTS "Users can view own communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can manage own communications" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_admin_select" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_own_all" ON public.executive_communications;
DROP POLICY IF EXISTS "exec_comms_own_select" ON public.executive_communications;

CREATE POLICY "exec_comms_owner_only"
ON public.executive_communications FOR ALL
USING (user_id = auth.uid());

-- 3. FIX: crm_leads - Restrict to assigned broker, owner, or admin
DROP POLICY IF EXISTS "CRM members can view leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can view assigned leads" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_member_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_member_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_member_update" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_admin_all" ON public.crm_leads;

CREATE POLICY "crm_leads_secure_select"
ON public.crm_leads FOR SELECT
USING (
  owner_user_id = auth.uid() OR
  created_by_user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "crm_leads_secure_insert"
ON public.crm_leads FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "crm_leads_secure_update"
ON public.crm_leads FOR UPDATE
USING (
  owner_user_id = auth.uid() OR
  created_by_user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "crm_leads_secure_delete"
ON public.crm_leads FOR DELETE
USING (
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

-- 4. FIX: broker_subscriptions - Restrict to owner only
DROP POLICY IF EXISTS "Authenticated users view own subscription or admins all" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_own_or_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_own_select" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subs_select_auth" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users view own subscription" ON public.broker_subscriptions;

CREATE POLICY "broker_subscriptions_secure_select"
ON public.broker_subscriptions FOR SELECT
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

-- 5. FIX: referral_partners - Partner can only see their own data
DROP POLICY IF EXISTS "Partners can view own data" ON public.referral_partners;
DROP POLICY IF EXISTS "Admins can manage partners" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_own_select" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_admin_all" ON public.referral_partners;

CREATE POLICY "referral_partners_secure_select"
ON public.referral_partners FOR SELECT
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "referral_partners_secure_update"
ON public.referral_partners FOR UPDATE
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

-- 6. FIX: hr_applications - Only HR admin and applicant
DROP POLICY IF EXISTS "HR members can view applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_public_insert" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_hr_select" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_hr_update" ON public.hr_applications;

CREATE POLICY "hr_applications_secure_select"
ON public.hr_applications FOR SELECT
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid() 
    AND is_active = true 
    AND department = 'Human Resources'
    AND crm_role IN ('admin', 'owner_admin', 'founder', 'sales_director')
  )
);

CREATE POLICY "hr_applications_public_submit"
ON public.hr_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "hr_applications_secure_update"
ON public.hr_applications FOR UPDATE
USING (
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid() 
    AND is_active = true 
    AND department = 'Human Resources'
    AND crm_role IN ('admin', 'owner_admin', 'founder')
  )
);

-- 7. FIX: vapi_call_logs - Only reviewer and admin (no assigned_broker_id column exists)
DROP POLICY IF EXISTS "CRM members can view call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_crm_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_admin_all" ON public.vapi_call_logs;

CREATE POLICY "vapi_call_logs_secure_select"
ON public.vapi_call_logs FOR SELECT
USING (
  reviewed_by = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "vapi_call_logs_secure_insert"
ON public.vapi_call_logs FOR INSERT
WITH CHECK (true);

-- 8. FIX: referral_partner_bank_vault - Extreme restriction
DROP POLICY IF EXISTS "Admins can view bank vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "CRM admins can view bank vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "bank_vault_admin_select" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "bank_vault_admin_all" ON public.referral_partner_bank_vault;

CREATE POLICY "bank_vault_owner_only"
ON public.referral_partner_bank_vault FOR ALL
USING (
  partner_id IN (SELECT id FROM public.referral_partners WHERE referral_partners.user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'owner')
);

-- 9. FIX: assistant_contacts - Clean up duplicate policies
DROP POLICY IF EXISTS "Users can manage own assistant_contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can view own assistant_contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users manage own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_admin_all" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_delete_own" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_insert_own" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own_delete" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own_insert" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own_select" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_own_update" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_select_own_or_admin" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_update_own" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_user_all" ON public.assistant_contacts;

CREATE POLICY "assistant_contacts_owner_only"
ON public.assistant_contacts FOR ALL
USING (user_id = auth.uid());

-- 10. FIX: support_tickets - Restrict to ticket creator and support staff
DROP POLICY IF EXISTS "Internal users can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Internal users can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_admin_select" ON public.support_tickets;

CREATE POLICY "support_tickets_secure_select"
ON public.support_tickets FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "support_tickets_secure_update"
ON public.support_tickets FOR UPDATE
USING (
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  public.is_crm_admin(auth.uid())
);

-- 11. FIX: broker_messages - Only conversation participants
DROP POLICY IF EXISTS "CRM members can view broker messages" ON public.broker_messages;
DROP POLICY IF EXISTS "Admins can manage broker messages" ON public.broker_messages;

CREATE POLICY "broker_messages_secure_select"
ON public.broker_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.broker_conversations bc
    WHERE bc.id = broker_messages.conversation_id
    AND (
      bc.escalated_to_user_id = auth.uid() OR
      public.has_role(auth.uid(), 'owner') OR
      public.has_role(auth.uid(), 'admin') OR
      public.is_crm_admin(auth.uid())
    )
  )
);

CREATE POLICY "broker_messages_secure_insert"
ON public.broker_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid() AND is_active = true
  )
);

-- 12. FIX: chat_conversations - Restrict to support staff only
DROP POLICY IF EXISTS "Admins can manage chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can manage conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view chats" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated chat select own" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_admin_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conv_admin_all" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conv_select_admin" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conv_service_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conv_update_admin" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_admin_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_admin_update" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_select_admin_only" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_update_admin_only" ON public.chat_conversations;

CREATE POLICY "chat_conversations_secure_select"
ON public.chat_conversations FOR SELECT
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "chat_conversations_public_insert"
ON public.chat_conversations FOR INSERT
WITH CHECK (true);

CREATE POLICY "chat_conversations_secure_update"
ON public.chat_conversations FOR UPDATE
USING (
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  public.is_crm_admin(auth.uid())
);

-- 13. FIX: employee_commissions - Only employee and admin
DROP POLICY IF EXISTS "HR and admins can view commissions" ON public.employee_commissions;
DROP POLICY IF EXISTS "employee_commissions_admin_all" ON public.employee_commissions;
DROP POLICY IF EXISTS "employee_commissions_own_select" ON public.employee_commissions;

CREATE POLICY "employee_commissions_secure_select"
ON public.employee_commissions FOR SELECT
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "employee_commissions_secure_manage"
ON public.employee_commissions FOR ALL
USING (
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);

-- 14. FIX: seller_listings - Restrict to listing owner only (no assigned_broker_id column)
DROP POLICY IF EXISTS "Listing admins can view all listings" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_admin_all" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_public_select" ON public.seller_listings;

CREATE POLICY "seller_listings_secure_select"
ON public.seller_listings FOR SELECT
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND role = 'listing_admin'
  )
);

CREATE POLICY "seller_listings_secure_insert"
ON public.seller_listings FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "seller_listings_secure_update"
ON public.seller_listings FOR UPDATE
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'admin')
);
