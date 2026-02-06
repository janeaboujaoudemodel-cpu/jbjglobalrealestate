-- =============================================
-- PHASE 5 FIX #1: hr_candidates PRIVILEGE HARDENING
-- =============================================

-- 1A: Revoke all privileges from anon role
REVOKE ALL ON TABLE public.hr_candidates FROM anon;

-- 1B: Revoke all privileges from public role
REVOKE ALL ON TABLE public.hr_candidates FROM public;

-- =============================================
-- PHASE 5 FIX #2: chat_conversations PRIVILEGE + POLICY HARDENING
-- =============================================

-- 2A: Revoke all privileges from anon role
REVOKE ALL ON TABLE public.chat_conversations FROM anon;

-- 2B: Revoke all privileges from public role
REVOKE ALL ON TABLE public.chat_conversations FROM public;

-- 2C: Grant ONLY INSERT to anon (minimal for chat widget)
GRANT INSERT ON TABLE public.chat_conversations TO anon;

-- 2D: Drop all existing policies (13 total - too many overlapping)
DROP POLICY IF EXISTS "Authenticated users can create chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can create conversations with valid email" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_rate_limited_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authorized staff can view all chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Only admins can view chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Staff can read chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Staff can view all chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_secure_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "Only admins can update chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Staff can update chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_secure_update" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_staff_update" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authorized staff can delete chat conversations" ON public.chat_conversations;

-- 2E: CREATE NEW CONSOLIDATED POLICIES

-- INSERT: Anonymous widget can create conversations (rate-limited, valid email, no user_id spoofing)
CREATE POLICY "chat_conversations_anon_insert"
  ON public.chat_conversations
  FOR INSERT
  TO anon
  WITH CHECK (
    user_email IS NOT NULL 
    AND user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND NOT is_email_domain_blocked(user_email)
    AND check_rate_limit(COALESCE(user_email, 'anon'), 'chat_conversation', 10, 60)
    AND user_id IS NULL
  );

-- INSERT: Authenticated users can create their own conversations
CREATE POLICY "chat_conversations_authenticated_insert"
  ON public.chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_email IS NOT NULL 
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- SELECT: Only admins/owners can view all conversations
CREATE POLICY "chat_conversations_admin_select"
  ON public.chat_conversations
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR is_crm_admin(auth.uid())
  );

-- SELECT: Users can view their own conversations (if user_id is set)
CREATE POLICY "chat_conversations_owner_select"
  ON public.chat_conversations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- UPDATE: Only admins/owners can update conversations
CREATE POLICY "chat_conversations_admin_update"
  ON public.chat_conversations
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR is_crm_admin(auth.uid())
  );

-- DELETE: Only owners can delete conversations
CREATE POLICY "chat_conversations_owner_delete"
  ON public.chat_conversations
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role));