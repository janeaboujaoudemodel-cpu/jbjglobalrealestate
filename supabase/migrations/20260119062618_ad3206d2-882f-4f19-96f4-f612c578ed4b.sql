-- Fix RLS Permission Issues - Part 2 (fixing vapi_call_logs policy)
-- The previous migration partially succeeded - this fixes the vapi_call_logs policy

-- 7. Fix vapi_call_logs SELECT - allow admin access or reviewed_by
DROP POLICY IF EXISTS "vapi_call_logs_broker_or_admin_select" ON public.vapi_call_logs;

CREATE POLICY "vapi_call_logs_admin_select"
ON public.vapi_call_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_crm_admin(auth.uid())
  OR reviewed_by = auth.uid()
);

-- 10. Fix seller_listings SELECT - listing admins and owners can view
DROP POLICY IF EXISTS "seller_listings_user_or_admin_select" ON public.seller_listings;

CREATE POLICY "seller_listings_user_or_admin_select"
ON public.seller_listings FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR EXISTS (
    SELECT 1 FROM crm_users_profile 
    WHERE crm_users_profile.user_id = auth.uid() 
    AND crm_users_profile.is_active = true
    AND crm_users_profile.department = 'Listings'
  )
);

-- 11. Fix referral_commissions SELECT - ensure partners can view own
DROP POLICY IF EXISTS "referral_commissions_partner_or_admin_select" ON public.referral_commissions;

CREATE POLICY "referral_commissions_partner_or_admin_select"
ON public.referral_commissions FOR SELECT
TO authenticated
USING (
  (referral_partner_id IN (SELECT id FROM referral_partners WHERE user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- 12. Fix referral_leads SELECT - ensure partners can view own leads
DROP POLICY IF EXISTS "referral_leads_partner_or_admin_select" ON public.referral_leads;

CREATE POLICY "referral_leads_partner_or_admin_select"
ON public.referral_leads FOR SELECT
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM referral_partners rp WHERE rp.id = referral_leads.referral_partner_id AND rp.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- 13. Fix hr_employees SELECT for HR managers
DROP POLICY IF EXISTS "hr_employees_hr_select" ON public.hr_employees;

CREATE POLICY "hr_employees_hr_manager_select"
ON public.hr_employees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR is_hr_manager(auth.uid())
  OR created_by = auth.uid()
);

-- 14. Fix hr_candidates SELECT
DROP POLICY IF EXISTS "hr_candidates_secure_select" ON public.hr_candidates;

CREATE POLICY "hr_candidates_hr_or_admin_select"
ON public.hr_candidates FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR is_hr_manager(auth.uid())
);