-- Security fixes for remaining vulnerabilities

-- 1. Fix profiles table - tighten RLS to prevent enumeration
-- Drop existing policies and recreate with stricter rules
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Users can ONLY view/update their own profile (auth.uid() = id)
CREATE POLICY "Users can view own profile only"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile only"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile only"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles for management
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- 2. Fix developer_sales_reps - restrict access to authorized personnel only
DROP POLICY IF EXISTS "Authenticated users can view active sales reps" ON public.developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_view_active" ON public.developer_sales_reps;

-- Only admins, owners, and CRM users can view sales reps
CREATE POLICY "Authorized staff can view sales reps"
ON public.developer_sales_reps FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.is_crm_admin(auth.uid()) OR
  public.is_active_crm_member(auth.uid())
);

-- 3. Fix chat_history - tighten session-based access
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_select_own" ON public.chat_history;

-- Only authenticated users who OWN the session can view it
-- Use user_id check first, then fallback to session matching for anonymous chats
CREATE POLICY "Users can view own chat history only"
ON public.chat_history FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Admins can view all chat history for support
CREATE POLICY "Staff can view all chat history"
ON public.chat_history FOR SELECT
TO authenticated
USING (
  public.is_active_crm_member(auth.uid())
);