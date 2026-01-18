-- Fix 1: Delete orphaned rows that have no user association
DELETE FROM public.seller_listings 
WHERE user_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.seller_listings 
ALTER COLUMN user_id SET NOT NULL;

-- Fix 2: Strengthen RLS on seller_listings
DROP POLICY IF EXISTS "Users can view their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Admins can view all listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.seller_listings;
DROP POLICY IF EXISTS "Listing admins can view all" ON public.seller_listings;
DROP POLICY IF EXISTS "Listing admins can update all" ON public.seller_listings;

-- Ensure RLS is enabled
ALTER TABLE public.seller_listings ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies
CREATE POLICY "Users can view their own listings"
ON public.seller_listings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings"
ON public.seller_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON public.seller_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.seller_listings FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all listings"
ON public.seller_listings FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.is_listing_admin(auth.uid())
);