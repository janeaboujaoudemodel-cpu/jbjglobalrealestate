-- =====================================================
-- CLEAN UP DUPLICATE/OVERLAPPING POLICIES
-- =====================================================

-- 1. CHAT_CONVERSATIONS - Remove duplicate policies, keep clean ones
DROP POLICY IF EXISTS "Admins can update chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can update chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated users can create chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view their own chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_admin_delete" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_admin_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_admin_update" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_public_insert" ON public.chat_conversations;

-- Create clean policies for chat_conversations
CREATE POLICY "chat_conversations_admin_all"
ON public.chat_conversations
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public can submit chat inquiries (contact forms need this)
CREATE POLICY "chat_conversations_public_insert"
ON public.chat_conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_email IS NOT NULL 
  AND user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND status = 'active'
);

-- Users can view their own chats if authenticated
CREATE POLICY "chat_conversations_own_select"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 2. EVALUATION_REQUESTS - Clean up duplicates
DROP POLICY IF EXISTS "Admins can view all evaluation_requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can insert own evaluation_requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view own evaluation_requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_anon_insert" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_delete" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_insert" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_select" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_update" ON public.evaluation_requests;

-- Clean policies for evaluation_requests
CREATE POLICY "evaluation_requests_select"
ON public.evaluation_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "evaluation_requests_insert"
ON public.evaluation_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_email IS NOT NULL 
  AND user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "evaluation_requests_update"
ON public.evaluation_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "evaluation_requests_delete"
ON public.evaluation_requests
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3. LEADS - Clean up duplicates
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads with valid data" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_admin_only" ON public.leads;
DROP POLICY IF EXISTS "leads_select_admin_only" ON public.leads;
DROP POLICY IF EXISTS "leads_update_admin_only" ON public.leads;

-- Clean policies for leads - admin only for select/update/delete
CREATE POLICY "leads_admin_select"
ON public.leads
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "leads_admin_update"
ON public.leads
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "leads_admin_delete"
ON public.leads
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Public can submit leads (contact forms)
CREATE POLICY "leads_public_insert"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND source IS NOT NULL
);