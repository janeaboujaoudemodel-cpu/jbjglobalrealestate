-- =====================================================================
-- SECURITY FIX 1: customer_reviews — stop leaking reviewer emails publicly
-- =====================================================================
DROP POLICY IF EXISTS "Public can view published reviews only" ON public.customer_reviews;

DROP VIEW IF EXISTS public.customer_reviews_public CASCADE;
CREATE VIEW public.customer_reviews_public
WITH (security_invoker = false) AS
SELECT
  id,
  CASE WHEN COALESCE(is_anonymous, false) THEN NULL ELSE full_name END AS display_name,
  rating,
  service_type,
  review_text,
  would_recommend,
  status,
  feature_key,
  improve_text,
  is_anonymous,
  published_at,
  created_at
FROM public.customer_reviews
WHERE status = 'published';

REVOKE ALL ON public.customer_reviews_public FROM PUBLIC;
GRANT SELECT ON public.customer_reviews_public TO anon, authenticated;

-- =====================================================================
-- SECURITY FIX 2: rewrite every RLS policy that queries profiles.user_role
-- so it uses the canonical public.has_role() helper instead.
-- =====================================================================

-- jbj_analytics
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.jbj_analytics;
CREATE POLICY "Admins can view all analytics"
ON public.jbj_analytics FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- investor_documents
DROP POLICY IF EXISTS "Admins can view all documents" ON public.investor_documents;
CREATE POLICY "Admins can view all documents"
ON public.investor_documents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- user_profile_summaries
DROP POLICY IF EXISTS "Owner can read all profile summaries" ON public.user_profile_summaries;
CREATE POLICY "Owner can read all profile summaries"
ON public.user_profile_summaries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- referral_code_usages
DROP POLICY IF EXISTS "Admins can view all referral code usages" ON public.referral_code_usages;
DROP POLICY IF EXISTS "Admins can insert referral code usages" ON public.referral_code_usages;
DROP POLICY IF EXISTS "Admins can update referral code usages" ON public.referral_code_usages;

CREATE POLICY "Admins can view all referral code usages"
ON public.referral_code_usages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert referral code usages"
ON public.referral_code_usages FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update referral code usages"
ON public.referral_code_usages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- ticket_surveys
DROP POLICY IF EXISTS "Owner can read all surveys" ON public.ticket_surveys;
CREATE POLICY "Owner can read all surveys"
ON public.ticket_surveys FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- broker_pdf_exports (legacy duplicate of broker_pdf_exports_select_admin)
DROP POLICY IF EXISTS "Admins can view all PDF exports" ON public.broker_pdf_exports;

-- jbj_issue_reports
DROP POLICY IF EXISTS "Admins can view all issue reports" ON public.jbj_issue_reports;
DROP POLICY IF EXISTS "Admins can update issue reports" ON public.jbj_issue_reports;
CREATE POLICY "Admins can view all issue reports"
ON public.jbj_issue_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins can update issue reports"
ON public.jbj_issue_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- hr_cv_submissions
DROP POLICY IF EXISTS "Owner and admins can view CV submissions" ON public.hr_cv_submissions;
DROP POLICY IF EXISTS "Owner and admins can update CV submissions" ON public.hr_cv_submissions;
CREATE POLICY "Owner and admins can view CV submissions"
ON public.hr_cv_submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner and admins can update CV submissions"
ON public.hr_cv_submissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- listing_admin_authorized_sources
DROP POLICY IF EXISTS "Founders can manage authorized sources" ON public.listing_admin_authorized_sources;
CREATE POLICY "Founders can manage authorized sources"
ON public.listing_admin_authorized_sources FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- listing_admin_scraped_data
DROP POLICY IF EXISTS "Admins can view scraped data" ON public.listing_admin_scraped_data;
CREATE POLICY "Admins can view scraped data"
ON public.listing_admin_scraped_data FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- referral_settings
DROP POLICY IF EXISTS "Admins can manage referral settings" ON public.referral_settings;
CREATE POLICY "Admins can manage referral settings"
ON public.referral_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- storage.objects (voice-samples bucket)
DROP POLICY IF EXISTS "Admins can view voice samples" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload voice samples" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete voice samples" ON storage.objects;
CREATE POLICY "Admins can view voice samples"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'voice-samples' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role)));
CREATE POLICY "Admins can upload voice samples"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-samples' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role)));
CREATE POLICY "Admins can delete voice samples"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voice-samples' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role)));

-- =====================================================================
-- Replace the legacy profiles_public view (depends on user_role) with
-- a definition that derives role from the canonical user_roles table.
-- =====================================================================
DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  p.id,
  p.full_name,
  ur.role::text AS user_role
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id;

REVOKE ALL ON public.profiles_public FROM PUBLIC;
GRANT SELECT ON public.profiles_public TO authenticated;

-- =====================================================================
-- Finally drop the privilege-escalation vector: profiles.user_role.
-- All app code and policies have been migrated to user_roles + has_role().
-- =====================================================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_role;