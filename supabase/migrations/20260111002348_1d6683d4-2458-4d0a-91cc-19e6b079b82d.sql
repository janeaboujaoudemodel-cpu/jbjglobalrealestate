-- Tighten security warnings by removing permissive OTP policies and restricting PII SELECT policies to authenticated users.

-- 1) OTP tables: remove permissive (true) insert/update policies (service role bypasses RLS anyway)

-- Email verifications
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can insert verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Service can update verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_public_insert" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verification_insert" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verification_admin_select" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_admin_select" ON public.email_verifications;
DROP POLICY IF EXISTS "Admins can view verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_admin_update" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_admin_delete" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verifications_admin_all" ON public.email_verifications;

CREATE POLICY "email_verifications_admin_all"
ON public.email_verifications
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- Phone verifications
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can insert phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Service can update phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Admins can view phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can manage own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "phone_verifications_admin_all" ON public.phone_verifications;

CREATE POLICY "phone_verifications_admin_all"
ON public.phone_verifications
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 2) Reduce false-positive PII warnings by restricting SELECT policies from PUBLIC to AUTHENTICATED
-- (Policy logic remains the same; this only tightens the role scope.)

-- Broker subscriptions / exports
ALTER POLICY "Admins can view all subscriptions" ON public.broker_subscriptions TO authenticated;
ALTER POLICY "Users can view their own subscription" ON public.broker_subscriptions TO authenticated;

ALTER POLICY "Admins can view all PDF exports" ON public.broker_pdf_exports TO authenticated;
ALTER POLICY "Users can view their own PDF exports" ON public.broker_pdf_exports TO authenticated;

-- Campaign recipients
ALTER POLICY "Users can view recipients via campaign" ON public.crm_campaign_recipients TO authenticated;

-- Discount usages
ALTER POLICY "Admins can view all discount usages" ON public.discount_code_usages TO authenticated;
ALTER POLICY "Users can view their own discount usage" ON public.discount_code_usages TO authenticated;

-- HR applications (own)
ALTER POLICY "hr_applications_select_own" ON public.hr_applications TO authenticated;

-- Analytics / issue reports
ALTER POLICY "Admins can view all analytics" ON public.jbj_analytics TO authenticated;

ALTER POLICY "Admins can view all issue reports" ON public.jbj_issue_reports TO authenticated;
ALTER POLICY "Users can view their own issue reports" ON public.jbj_issue_reports TO authenticated;

-- Memberships
ALTER POLICY "memberships_select_admin" ON public.memberships TO authenticated;
ALTER POLICY "memberships_select_own" ON public.memberships TO authenticated;

-- Referral partner data
ALTER POLICY "Partners can view their own leads" ON public.referral_leads TO authenticated;
ALTER POLICY "Admins can view all partners" ON public.referral_partners TO authenticated;
ALTER POLICY "Users can view their own partner profile" ON public.referral_partners TO authenticated;

-- Security logs / call logs
ALTER POLICY "Only admins can view security logs" ON public.security_access_logs TO authenticated;
ALTER POLICY "Admins can view all call logs" ON public.vapi_call_logs TO authenticated;
