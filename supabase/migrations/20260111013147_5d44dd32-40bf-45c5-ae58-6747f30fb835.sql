
-- =====================================================
-- PART 4 FIXED: REFERRAL, BROKER_CONTRACTS, OTP TABLES
-- =====================================================

-- 14. REFERRAL_PARTNERS - Restrict to own or admin
DROP POLICY IF EXISTS "referral_partners_select" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_insert" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_update" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_select_own_or_admin" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_insert_own" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_update_own_or_admin" ON public.referral_partners;

CREATE POLICY "referral_partners_select_own_or_admin"
ON public.referral_partners FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "referral_partners_insert_own"
ON public.referral_partners FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "referral_partners_update_own_or_admin"
ON public.referral_partners FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 15. REFERRAL_LEADS - Restrict to partner owner or admin
DROP POLICY IF EXISTS "referral_leads_select" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_insert" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_update" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_select_partner_or_admin" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_insert_partner" ON public.referral_leads;
DROP POLICY IF EXISTS "referral_leads_update_admin_only" ON public.referral_leads;

CREATE POLICY "referral_leads_select_partner_or_admin"
ON public.referral_leads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.referral_partners 
    WHERE id = referral_leads.referral_partner_id 
    AND user_id = auth.uid()
  ) OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "referral_leads_insert_partner"
ON public.referral_leads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.referral_partners 
    WHERE id = referral_partner_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "referral_leads_update_admin_only"
ON public.referral_leads FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 16. BROKER_CONTRACTS - Restrict to own or admin
DROP POLICY IF EXISTS "broker_contracts_select" ON public.broker_contracts;
DROP POLICY IF EXISTS "broker_contracts_insert" ON public.broker_contracts;
DROP POLICY IF EXISTS "broker_contracts_update" ON public.broker_contracts;
DROP POLICY IF EXISTS "broker_contracts_select_own_or_admin" ON public.broker_contracts;
DROP POLICY IF EXISTS "broker_contracts_insert_own" ON public.broker_contracts;
DROP POLICY IF EXISTS "broker_contracts_update_own" ON public.broker_contracts;

CREATE POLICY "broker_contracts_select_own_or_admin"
ON public.broker_contracts FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "broker_contracts_insert_own"
ON public.broker_contracts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "broker_contracts_update_own"
ON public.broker_contracts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- OTP Tables - Admin only
DROP POLICY IF EXISTS "email_verifications_admin_only" ON public.email_verifications;
DROP POLICY IF EXISTS "phone_verifications_admin_only" ON public.phone_verifications;

CREATE POLICY "email_verifications_admin_only"
ON public.email_verifications FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "phone_verifications_admin_only"
ON public.phone_verifications FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Enable RLS
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
