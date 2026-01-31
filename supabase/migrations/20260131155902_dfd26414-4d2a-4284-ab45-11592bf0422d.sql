
-- Recreate view as SECURITY INVOKER (default) to fix linter warning
-- The view already shows masked data only, so it doesn't need SECURITY DEFINER
DROP VIEW IF EXISTS public.seller_listings_secure;
CREATE VIEW public.seller_listings_secure AS
SELECT 
  id,
  user_id,
  seller_full_name,
  seller_phone,
  seller_email,
  preferred_language,
  preferred_contact_method,
  seller_type,
  property_type,
  property_location,
  community_building,
  bedrooms,
  property_size_sqft,
  property_status,
  property_notes,
  target_selling_price,
  selling_urgency,
  is_furnished,
  has_upgrades,
  upgrade_details,
  key_highlights,
  status,
  created_at,
  updated_at
FROM public.seller_listings;

-- Grant select
GRANT SELECT ON public.seller_listings_secure TO authenticated;

-- Migrate existing records to encrypt them
UPDATE public.seller_listings
SET updated_at = now()
WHERE seller_name_encrypted IS NULL 
  AND seller_full_name IS NOT NULL
  AND seller_full_name NOT LIKE 'Protected-%';
