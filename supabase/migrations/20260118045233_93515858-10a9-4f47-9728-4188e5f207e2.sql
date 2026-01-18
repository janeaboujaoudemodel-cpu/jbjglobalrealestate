-- =====================================================
-- PROFILES TABLE SECURITY CONSOLIDATION
-- Fix overlapping RLS policies and create secure public view
-- =====================================================

-- Step 1: Drop all existing redundant SELECT policies on profiles
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_restricted" ON public.profiles;

-- Step 2: Drop duplicate UPDATE policies (keep only one)
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;

-- Step 3: Drop duplicate INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_system_insert" ON public.profiles;

-- Step 4: Drop the ALL policy (too broad, will replace with specific policies)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- =====================================================
-- CREATE CONSOLIDATED CLEAN RLS POLICIES
-- =====================================================

-- SELECT: Users can only see their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins/owners can see all profiles
CREATE POLICY "profiles_select_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- INSERT: Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admins can update any profile
CREATE POLICY "profiles_update_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_admin"
ON public.profiles FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- =====================================================
-- CREATE SECURE PUBLIC VIEW (excludes sensitive fields)
-- =====================================================

-- Drop existing view if any
DROP VIEW IF EXISTS public.profiles_public;

-- Create a safe public view that excludes email, phone, and other PII
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  created_at
FROM public.profiles;

-- Add comment for documentation
COMMENT ON VIEW public.profiles_public IS 'Safe public view of profiles excluding email, phone, and other PII. Use this for public-facing queries.';