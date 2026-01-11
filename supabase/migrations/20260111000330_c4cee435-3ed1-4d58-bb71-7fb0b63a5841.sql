-- ============================================
-- SECURITY HARDENING MIGRATION - PART 3
-- Remaining policies (skipping already created ones)
-- ============================================

-- 13. ASSISTANT_COMMUNICATIONS - Protect executive messages
DROP POLICY IF EXISTS "assistant_communications_select" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_insert" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_update" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can view own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can insert own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can update own communications" ON public.assistant_communications;

ALTER TABLE public.assistant_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own communications"
ON public.assistant_communications FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can insert own communications"
ON public.assistant_communications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communications"
ON public.assistant_communications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));


-- 14. ASSISTANT_CONTACTS - Protect contact database
DROP POLICY IF EXISTS "assistant_contacts_select" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_insert" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_update" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_delete" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can view own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.assistant_contacts;

ALTER TABLE public.assistant_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
ON public.assistant_contacts FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can insert own contacts"
ON public.assistant_contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
ON public.assistant_contacts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
ON public.assistant_contacts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 15. EXECUTIVE_COMMUNICATIONS - Protect encrypted messages
DROP POLICY IF EXISTS "executive_communications_select" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_insert" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_update" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can view own exec communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can insert own exec communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Users can update own exec communications" ON public.executive_communications;

ALTER TABLE public.executive_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exec communications"
ON public.executive_communications FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can insert own exec communications"
ON public.executive_communications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exec communications"
ON public.executive_communications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);


-- 16. EXECUTIVE_FINANCIAL_TRANSACTIONS - Protect financial data
DROP POLICY IF EXISTS "executive_financial_transactions_select" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "executive_financial_transactions_insert" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "executive_financial_transactions_update" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "Users can view own financial transactions" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "Users can insert own financial transactions" ON public.executive_financial_transactions;
DROP POLICY IF EXISTS "Users can update own financial transactions" ON public.executive_financial_transactions;

ALTER TABLE public.executive_financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial transactions"
ON public.executive_financial_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can insert own financial transactions"
ON public.executive_financial_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial transactions"
ON public.executive_financial_transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);


-- 17. BROKER_PROFILES - Protect private contact info
DROP POLICY IF EXISTS "broker_profiles_select" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_insert" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_update" ON public.broker_profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.broker_profiles;

ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public profiles"
ON public.broker_profiles FOR SELECT
TO anon, authenticated
USING (is_public = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can insert own broker profile"
ON public.broker_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own broker profile"
ON public.broker_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));


-- 18. EMAIL_VERIFICATIONS - Restrict OTP access
DROP POLICY IF EXISTS "email_verifications_select" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_insert" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_update" ON public.email_verifications;
DROP POLICY IF EXISTS "Admins can view verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Service can insert verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Service can update verifications" ON public.email_verifications;

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view verifications"
ON public.email_verifications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Service can insert verifications"
ON public.email_verifications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service can update verifications"
ON public.email_verifications FOR UPDATE
TO anon, authenticated
USING (true);


-- 19. PHONE_VERIFICATIONS - Restrict OTP access
DROP POLICY IF EXISTS "phone_verifications_select" ON public.phone_verifications;
DROP POLICY IF EXISTS "phone_verifications_insert" ON public.phone_verifications;
DROP POLICY IF EXISTS "phone_verifications_update" ON public.phone_verifications;
DROP POLICY IF EXISTS "Admins can view phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service can insert phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service can update phone verifications" ON public.phone_verifications;

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view phone verifications"
ON public.phone_verifications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Service can insert phone verifications"
ON public.phone_verifications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service can update phone verifications"
ON public.phone_verifications FOR UPDATE
TO anon, authenticated
USING (true);


-- 20. DISCOUNT_CODES - Admin only
DROP POLICY IF EXISTS "discount_codes_select" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_insert" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_update" ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can view discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can insert discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can update discount codes" ON public.discount_codes;

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view discount codes"
ON public.discount_codes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can insert discount codes"
ON public.discount_codes FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can update discount codes"
ON public.discount_codes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));


-- 21. CRM_CAMPAIGN_RECIPIENTS - Restrict to campaign owners
DROP POLICY IF EXISTS "crm_campaign_recipients_select" ON public.crm_campaign_recipients;
DROP POLICY IF EXISTS "crm_campaign_recipients_insert" ON public.crm_campaign_recipients;
DROP POLICY IF EXISTS "Campaign owners can view recipients" ON public.crm_campaign_recipients;
DROP POLICY IF EXISTS "Campaign owners can insert recipients" ON public.crm_campaign_recipients;

ALTER TABLE public.crm_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign owners can view recipients"
ON public.crm_campaign_recipients FOR SELECT
TO authenticated
USING (
  campaign_id IN (SELECT id FROM public.crm_email_campaigns WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "Campaign owners can insert recipients"
ON public.crm_campaign_recipients FOR INSERT
TO authenticated
WITH CHECK (
  campaign_id IN (SELECT id FROM public.crm_email_campaigns WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner') OR
  public.is_crm_admin(auth.uid())
);


-- 22. HR_INTERVIEW_INVITATIONS - HR admin only
DROP POLICY IF EXISTS "hr_interview_invitations_select" ON public.hr_interview_invitations;
DROP POLICY IF EXISTS "hr_interview_invitations_insert" ON public.hr_interview_invitations;
DROP POLICY IF EXISTS "hr_interview_invitations_update" ON public.hr_interview_invitations;
DROP POLICY IF EXISTS "HR admins can view invitations" ON public.hr_interview_invitations;
DROP POLICY IF EXISTS "HR admins can insert invitations" ON public.hr_interview_invitations;
DROP POLICY IF EXISTS "HR admins can update invitations" ON public.hr_interview_invitations;

ALTER TABLE public.hr_interview_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR admins can view invitations"
ON public.hr_interview_invitations FOR SELECT
TO authenticated
USING (public.is_hr_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "HR admins can insert invitations"
ON public.hr_interview_invitations FOR INSERT
TO authenticated
WITH CHECK (public.is_hr_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "HR admins can update invitations"
ON public.hr_interview_invitations FOR UPDATE
TO authenticated
USING (public.is_hr_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));