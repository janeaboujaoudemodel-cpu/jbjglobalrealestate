-- ============================================
-- SELLER_LISTINGS: Clean up and secure
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Admins can manage seller_listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can manage own seller_listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_delete_secure" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_insert_secure" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_secure_insert" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_secure_select" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_secure_update" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_select_secure" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_update_secure" ON public.seller_listings;
DROP POLICY IF EXISTS "seller_listings_user_or_admin_select" ON public.seller_listings;

-- Create clean, minimal policies

-- Sellers can view only their own listings
CREATE POLICY "seller_view_own"
ON public.seller_listings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only listing admins and owner can view all listings
CREATE POLICY "listing_admin_view_all"
ON public.seller_listings FOR SELECT
TO authenticated
USING (
  public.is_listing_admin(auth.uid()) 
  OR public.has_role(auth.uid(), 'owner')
);

-- Sellers can insert their own listings
CREATE POLICY "seller_insert_own"
ON public.seller_listings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Sellers can update only draft listings
CREATE POLICY "seller_update_draft"
ON public.seller_listings FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft')
WITH CHECK (user_id = auth.uid() AND status = 'draft');

-- Listing admins can update any listing (for approval workflow)
CREATE POLICY "listing_admin_update"
ON public.seller_listings FOR UPDATE
TO authenticated
USING (public.is_listing_admin(auth.uid()) OR public.has_role(auth.uid(), 'owner'));

-- Only owner can delete listings (no admin delete)
CREATE POLICY "owner_delete_only"
ON public.seller_listings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- ============================================
-- VIP_CLIENTS: Clean up and secure
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "CRM users can view VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "Only admins can delete VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "Users can insert VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "Users can update own VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "Users can view own VIP clients" ON public.vip_clients;

-- Create clean, minimal policies

-- Users can view only their own VIP client record (if they are a VIP)
CREATE POLICY "vip_view_own"
ON public.vip_clients FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only owner and sales director can view all VIP clients (not regular admins)
CREATE POLICY "executive_view_all"
ON public.vip_clients FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner') 
  OR public.is_sales_director(auth.uid())
);

-- Only owner can insert VIP clients
CREATE POLICY "owner_insert"
ON public.vip_clients FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Only owner or assigned relationship manager can update
CREATE POLICY "owner_or_rm_update"
ON public.vip_clients FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  OR user_id = auth.uid()
);

-- Only owner can delete VIP clients
CREATE POLICY "owner_delete"
ON public.vip_clients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));