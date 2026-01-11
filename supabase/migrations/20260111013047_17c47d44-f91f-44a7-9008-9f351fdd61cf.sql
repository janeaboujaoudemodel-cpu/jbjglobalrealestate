
-- =====================================================
-- PART 3: HR TABLES, VAPI, ASSISTANT, EXECUTIVE
-- =====================================================

-- 8. HR_APPLICATIONS - Restrict to own or HR admin
DROP POLICY IF EXISTS "hr_applications_insert_public" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_select_admin" ON public.hr_applications;
DROP POLICY IF EXISTS "Anyone can submit application" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_select_admin_only" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_update_admin_only" ON public.hr_applications;

CREATE POLICY "hr_applications_insert_public"
ON public.hr_applications FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "hr_applications_select_admin_only"
ON public.hr_applications FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role) OR
  (user_id IS NOT NULL AND user_id = auth.uid())
);

CREATE POLICY "hr_applications_update_admin_only"
ON public.hr_applications FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 9. HR_CANDIDATES - Restrict to HR admin only
DROP POLICY IF EXISTS "hr_candidates_select" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_insert" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_update" ON public.hr_candidates;
DROP POLICY IF EXISTS "Admins can view candidates" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_select_admin_only" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_insert_admin_only" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_update_admin_only" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_delete_admin_only" ON public.hr_candidates;

CREATE POLICY "hr_candidates_select_admin_only"
ON public.hr_candidates FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "hr_candidates_insert_admin_only"
ON public.hr_candidates FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "hr_candidates_update_admin_only"
ON public.hr_candidates FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "hr_candidates_delete_admin_only"
ON public.hr_candidates FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 10. VAPI_CALL_LOGS - Restrict to admin only
DROP POLICY IF EXISTS "vapi_call_logs_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_insert" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can view call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_select_admin_only" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_insert_service" ON public.vapi_call_logs;

CREATE POLICY "vapi_call_logs_select_admin_only"
ON public.vapi_call_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "vapi_call_logs_insert_service"
ON public.vapi_call_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 11. ASSISTANT_CONTACTS - Restrict to own or admin
DROP POLICY IF EXISTS "assistant_contacts_select" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_insert" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_update" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can view own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_select_own_or_admin" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_insert_own" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_update_own" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_delete_own" ON public.assistant_contacts;

CREATE POLICY "assistant_contacts_select_own_or_admin"
ON public.assistant_contacts FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "assistant_contacts_insert_own"
ON public.assistant_contacts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "assistant_contacts_update_own"
ON public.assistant_contacts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "assistant_contacts_delete_own"
ON public.assistant_contacts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 12. ASSISTANT_COMMUNICATIONS - Restrict to own or admin
DROP POLICY IF EXISTS "assistant_communications_select" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_insert" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_update" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_select_own_or_admin" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_insert_own" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_communications_update_own" ON public.assistant_communications;

CREATE POLICY "assistant_communications_select_own_or_admin"
ON public.assistant_communications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "assistant_communications_insert_own"
ON public.assistant_communications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "assistant_communications_update_own"
ON public.assistant_communications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 13. EXECUTIVE_COMMUNICATIONS - Restrict to own or admin
DROP POLICY IF EXISTS "executive_communications_select" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_insert" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_update" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_select_own_or_admin" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_insert_own" ON public.executive_communications;
DROP POLICY IF EXISTS "executive_communications_update_own" ON public.executive_communications;

CREATE POLICY "executive_communications_select_own_or_admin"
ON public.executive_communications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "executive_communications_insert_own"
ON public.executive_communications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "executive_communications_update_own"
ON public.executive_communications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Enable RLS
ALTER TABLE public.hr_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_communications ENABLE ROW LEVEL SECURITY;
