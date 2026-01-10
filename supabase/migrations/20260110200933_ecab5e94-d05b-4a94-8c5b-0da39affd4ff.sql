
-- =====================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION (CORRECTED)
-- Using correct column names for each table
-- =====================================================

-- 1. FIX LEADS TABLE (has 'email' column)
DROP POLICY IF EXISTS "leads_public_insert_validated" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "leads_validated_insert_only" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_select" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_update" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_delete" ON public.leads;
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

CREATE POLICY "leads_validated_insert_only"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND 
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  NOT public.is_email_domain_blocked(email) AND
  source IN ('website', 'contact_form', 'landing_page', 'referral', 'chat', 'whatsapp', 'manual') AND
  (honeypot IS NULL OR honeypot = '')
);

CREATE POLICY "leads_admin_select"
ON public.leads
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "leads_admin_update"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner') OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "leads_admin_delete"
ON public.leads
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- 2. FIX CHAT_CONVERSATIONS TABLE (has 'user_email' column)
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can insert conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_validated_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_admin_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;

CREATE POLICY "chat_validated_insert"
ON public.chat_conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_email IS NOT NULL AND
  user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  NOT public.is_email_domain_blocked(user_email)
);

CREATE POLICY "chat_admin_select"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- 3. FIX EVALUATION_REQUESTS TABLE (has 'user_email' column)
DROP POLICY IF EXISTS "Anyone can submit evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Public can insert evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_validated_insert" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_admin_select" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can view evaluation requests" ON public.evaluation_requests;

CREATE POLICY "evaluation_validated_insert"
ON public.evaluation_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_email IS NOT NULL AND
  user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  NOT public.is_email_domain_blocked(user_email)
);

CREATE POLICY "evaluation_admin_select"
ON public.evaluation_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- 4. FIX EMAIL_VERIFICATIONS TABLE
DROP POLICY IF EXISTS "Anyone can insert email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Public can insert verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verification_insert" ON public.email_verifications;
DROP POLICY IF EXISTS "email_verification_admin_select" ON public.email_verifications;
DROP POLICY IF EXISTS "admin_select_verifications" ON public.email_verifications;

CREATE POLICY "email_verification_insert"
ON public.email_verifications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  NOT public.is_email_domain_blocked(email)
);

CREATE POLICY "email_verification_admin_select"
ON public.email_verifications
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- 5. STRENGTHEN USER_JOURNEY_EVENTS
DROP POLICY IF EXISTS "Anyone can insert journey events" ON public.user_journey_events;
DROP POLICY IF EXISTS "Public can insert events" ON public.user_journey_events;
DROP POLICY IF EXISTS "journey_events_validated_insert" ON public.user_journey_events;
DROP POLICY IF EXISTS "journey_events_admin_select" ON public.user_journey_events;
DROP POLICY IF EXISTS "Admins can view events" ON public.user_journey_events;

CREATE POLICY "journey_events_validated_insert"
ON public.user_journey_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IS NOT NULL AND
  session_id IS NOT NULL
);

CREATE POLICY "journey_events_admin_select"
ON public.user_journey_events
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- 6. STRENGTHEN PWA_ANALYTICS
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.pwa_analytics;
DROP POLICY IF EXISTS "Public can insert pwa analytics" ON public.pwa_analytics;
DROP POLICY IF EXISTS "pwa_analytics_validated_insert" ON public.pwa_analytics;
DROP POLICY IF EXISTS "pwa_analytics_admin_select" ON public.pwa_analytics;
DROP POLICY IF EXISTS "Admins can view analytics" ON public.pwa_analytics;

CREATE POLICY "pwa_analytics_validated_insert"
ON public.pwa_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IS NOT NULL
);

CREATE POLICY "pwa_analytics_admin_select"
ON public.pwa_analytics
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner')
);

-- 7. ENSURE HR_APPLICATIONS IS PROTECTED
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_authenticated_insert" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_admin_select" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_admin_update" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admins can view applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admins can update applications" ON public.hr_applications;

CREATE POLICY "hr_applications_authenticated_insert"
ON public.hr_applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  email IS NOT NULL AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "hr_applications_admin_select"
ON public.hr_applications
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner') OR
  public.is_hr_admin(auth.uid())
);

CREATE POLICY "hr_applications_admin_update"
ON public.hr_applications
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'owner') OR
  public.is_hr_admin(auth.uid())
);

-- 8. PROTECT STORAGE BUCKETS
UPDATE storage.buckets SET public = false WHERE id = 'hr-documents';
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- 9. Add indexes for faster security checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
