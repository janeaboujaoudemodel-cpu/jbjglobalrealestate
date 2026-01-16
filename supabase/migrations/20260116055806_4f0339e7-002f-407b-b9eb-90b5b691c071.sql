-- =====================================================
-- SECURITY FIX: profiles table - restrict public access
-- Issue: profiles_table_public_exposure (error level)
-- =====================================================

-- First, drop all existing SELECT policies to clean up duplicates
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

-- Create a single, clean SELECT policy - users can only view their own profile
-- Admins/owners can view all profiles
CREATE POLICY "profiles_select_restricted"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Ensure no anonymous/public access to profiles
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM public;

-- =====================================================
-- SECURITY FIX: seller_listings table - remove public role access
-- Issue: seller_listings_document_exposure (error level)
-- =====================================================

-- Drop the problematic policies that use 'public' role (allows unauthenticated access!)
DROP POLICY IF EXISTS "Admins can delete seller listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can create own seller listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can update own draft seller listings" ON public.seller_listings;

-- Drop duplicate/overlapping SELECT policies
DROP POLICY IF EXISTS "Sellers can view own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Staff can view seller listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can view own seller_listings" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_own_or_admin" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_select_auth" ON public.seller_listings;

-- Recreate policies with proper 'authenticated' role only

-- SELECT: Users can view their own listings, admins/owners can view all
CREATE POLICY "seller_listings_select_secure"
ON public.seller_listings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_listing_admin(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- INSERT: Only authenticated users can create their own listings
CREATE POLICY "seller_listings_insert_secure"
ON public.seller_listings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own drafts, admins can update all
CREATE POLICY "seller_listings_update_secure"
ON public.seller_listings
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'draft')
  OR is_listing_admin(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  (auth.uid() = user_id AND status = 'draft')
  OR is_listing_admin(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- DELETE: Only admins/owners can delete listings
CREATE POLICY "seller_listings_delete_secure"
ON public.seller_listings
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Revoke all public/anonymous access to seller_listings
REVOKE ALL ON public.seller_listings FROM anon;
REVOKE ALL ON public.seller_listings FROM public;