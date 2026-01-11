
-- =====================================================
-- PART 2: CHAT, EVALUATION, MEMBERSHIPS, CRM_LEADS
-- =====================================================

-- 4. CHAT_CONVERSATIONS - Restrict to admin only
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert chat" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_insert_public" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_select_admin_only" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_update_admin_only" ON public.chat_conversations;

CREATE POLICY "chat_conversations_insert_public"
ON public.chat_conversations FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_email IS NOT NULL AND
  user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "chat_conversations_select_admin_only"
ON public.chat_conversations FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "chat_conversations_update_admin_only"
ON public.chat_conversations FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 5. EVALUATION_REQUESTS - Restrict to own or admin
DROP POLICY IF EXISTS "Users can view own evaluations" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Anyone can insert evaluation request" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can view all evaluations" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_insert_public" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_select_admin_only" ON public.evaluation_requests;

CREATE POLICY "evaluation_requests_insert_public"
ON public.evaluation_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_email IS NOT NULL AND
  user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "evaluation_requests_select_admin_only"
ON public.evaluation_requests FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role) OR
  (user_id IS NOT NULL AND user_id = auth.uid())
);

-- 6. MEMBERSHIPS - Restrict to own or admin
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_own_or_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_own_or_admin" ON public.memberships;

CREATE POLICY "memberships_select_own_or_admin"
ON public.memberships FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "memberships_insert_own"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "memberships_update_own_or_admin"
ON public.memberships FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 7. CRM_LEADS - Secure access
DROP POLICY IF EXISTS "crm_leads_select_policy" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_insert_policy" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_update_policy" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete_policy" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can view assigned leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can view own leads" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_select_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_insert_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_update_secure" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete_admin_only" ON public.crm_leads;

CREATE POLICY "crm_leads_select_secure"
ON public.crm_leads FOR SELECT
TO authenticated
USING (
  public.is_crm_admin(auth.uid()) OR
  owner_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.crm_lead_assignments 
    WHERE lead_id = crm_leads.id 
    AND assigned_to_user_id = auth.uid() 
    AND unassigned_at IS NULL
  )
);

CREATE POLICY "crm_leads_insert_secure"
ON public.crm_leads FOR INSERT
TO authenticated
WITH CHECK (public.is_active_crm_member(auth.uid()));

CREATE POLICY "crm_leads_update_secure"
ON public.crm_leads FOR UPDATE
TO authenticated
USING (
  public.is_crm_admin(auth.uid()) OR
  owner_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.crm_lead_assignments 
    WHERE lead_id = crm_leads.id 
    AND assigned_to_user_id = auth.uid() 
    AND unassigned_at IS NULL
  )
);

CREATE POLICY "crm_leads_delete_admin_only"
ON public.crm_leads FOR DELETE
TO authenticated
USING (public.is_crm_admin(auth.uid()));

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
