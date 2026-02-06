
-- ============================================================
-- PHASE 1 SECURITY FIX: toolkit_jobs Table
-- ============================================================
-- This migration adds user_id, enables FORCE RLS, and creates
-- strict ownership policies. Table is confirmed EMPTY (0 rows).
-- ============================================================

-- Step 1: Add user_id column (NOT NULL - safe because table is empty)
ALTER TABLE public.toolkit_jobs 
ADD COLUMN user_id UUID NOT NULL;

-- Step 2: Enable FORCE RLS (was only RLS enabled, not forced)
ALTER TABLE public.toolkit_jobs FORCE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing insecure policies
DROP POLICY IF EXISTS "Allow anonymous insert toolkit jobs" ON public.toolkit_jobs;
DROP POLICY IF EXISTS "Allow session-based select toolkit jobs" ON public.toolkit_jobs;
DROP POLICY IF EXISTS "Allow session-based update toolkit jobs" ON public.toolkit_jobs;

-- Step 4: Create strict owner policies

-- SELECT: Users can only view their own jobs
CREATE POLICY "toolkit_jobs_owner_select"
ON public.toolkit_jobs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Users can only create jobs for themselves
CREATE POLICY "toolkit_jobs_owner_insert"
ON public.toolkit_jobs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own jobs
CREATE POLICY "toolkit_jobs_owner_update"
ON public.toolkit_jobs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only delete their own jobs
CREATE POLICY "toolkit_jobs_owner_delete"
ON public.toolkit_jobs
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Step 5: Create admin override policies

-- Admin SELECT all
CREATE POLICY "toolkit_jobs_admin_select"
ON public.toolkit_jobs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin UPDATE all
CREATE POLICY "toolkit_jobs_admin_update"
ON public.toolkit_jobs
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin DELETE all
CREATE POLICY "toolkit_jobs_admin_delete"
ON public.toolkit_jobs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- PHASE 1 SECURITY FIX: chat_history Table
-- ============================================================
-- Fix INSERT policies to enforce user ownership
-- Using Option A: Strict user_id enforcement on direct inserts
-- ============================================================

-- Step 1: Drop insecure INSERT policies
DROP POLICY IF EXISTS "chat_history_auth_insert" ON public.chat_history;
DROP POLICY IF EXISTS "Rate limited chat insert" ON public.chat_history;

-- Step 2: Create secure INSERT policy
-- Users can insert chat logs only for themselves (when authenticated)
-- OR with valid session for anonymous chat (but linked to that session only)
CREATE POLICY "chat_history_owner_insert"
ON public.chat_history
FOR INSERT
TO authenticated
WITH CHECK (
  -- If user_id is provided, it must match auth.uid()
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR
  -- If user_id is null (anonymous chat), session_id must be valid
  (user_id IS NULL AND session_id IS NOT NULL AND length(session_id) > 10)
);

-- Step 3: Allow anonymous users to insert with rate limiting (for lead capture chats)
CREATE POLICY "chat_history_anon_insert"
ON public.chat_history
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL 
  AND session_id IS NOT NULL 
  AND length(session_id) > 10
  AND check_chat_rate_limit(session_id)
);

-- Step 4: Enable FORCE RLS on chat_history if not already
ALTER TABLE public.chat_history FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Create SECURITY DEFINER function for server-side chat logging
-- ============================================================
-- This function allows edge functions to log chats securely
-- by deriving user_id from the authenticated context

CREATE OR REPLACE FUNCTION public.log_chat_message(
  p_session_id TEXT,
  p_role TEXT,
  p_message TEXT,
  p_source TEXT,
  p_source_page TEXT DEFAULT NULL,
  p_user_name TEXT DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_user_phone TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_chat_id UUID;
BEGIN
  -- Derive user_id from auth context (never accept from input)
  v_user_id := auth.uid();
  
  -- Validate required fields
  IF p_session_id IS NULL OR length(p_session_id) < 10 THEN
    RAISE EXCEPTION 'Invalid session_id';
  END IF;
  
  IF p_message IS NULL OR length(p_message) = 0 THEN
    RAISE EXCEPTION 'Message is required';
  END IF;
  
  IF p_role NOT IN ('user', 'assistant', 'system') THEN
    RAISE EXCEPTION 'Invalid role: must be user, assistant, or system';
  END IF;
  
  -- Insert the chat message
  INSERT INTO public.chat_history (
    session_id,
    role,
    message,
    source,
    source_page,
    user_id,
    user_name,
    user_email,
    user_phone,
    metadata
  ) VALUES (
    p_session_id,
    p_role,
    p_message,
    p_source,
    COALESCE(p_source_page, '/'),
    v_user_id,  -- Always from auth context, never from input
    p_user_name,
    p_user_email,
    p_user_phone,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_chat_id;
  
  RETURN v_chat_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_chat_message TO authenticated;

-- Revoke from public/anon to ensure only authenticated can use it
REVOKE EXECUTE ON FUNCTION public.log_chat_message FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_chat_message FROM public;

COMMENT ON FUNCTION public.log_chat_message IS 
'Securely logs chat messages. User ID is ALWAYS derived from auth.uid(), never accepted from input. Use this for edge functions to log chat history securely.';
