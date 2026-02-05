-- Fix: Restrict rental_listings landlord PII access
-- Only landlord owner, listing admins, and authorized staff can see landlord details

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view live rental listings" ON public.rental_listings;

-- Create strict SELECT policies:

-- 1. Owners can view their own listings (full access including PII)
-- (Already exists: "Users can view their own rental listings")

-- 2. Listing admins can view all listings (for management)
CREATE POLICY "Listing admins can view all rental listings"
ON public.rental_listings
FOR SELECT
TO authenticated
USING (public.is_listing_admin(auth.uid()));

-- 3. Staff with admin/owner roles can view all
CREATE POLICY "Staff can view all rental listings"
ON public.rental_listings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- 4. CRM users (employees) can view for client management
CREATE POLICY "CRM users can view rental listings"
ON public.rental_listings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Update the public view to use security_invoker for proper RLS enforcement
DROP VIEW IF EXISTS public.rental_listings_public;

CREATE VIEW public.rental_listings_public
WITH (security_invoker = on)
AS SELECT 
    id,
    user_id,
    property_title,
    property_type,
    bedrooms,
    bathrooms,
    size_sqft,
    furnished,
    emirate,
    community,
    building_name,
    address,
    annual_rent,
    payment_terms,
    security_deposit,
    ownership_type,
    images,
    video_url,
    description,
    amenities,
    status,
    created_at,
    updated_at,
    -- Masked PII for public view
    CASE 
        WHEN landlord_name IS NOT NULL AND length(landlord_name) > 0 
        THEN left(landlord_name, 1) || '***'
        ELSE NULL
    END AS landlord_name_masked,
    NULL::text AS landlord_email,
    NULL::text AS landlord_phone,
    NULL::text AS landlord_nationality
FROM public.rental_listings
WHERE status = 'live';

-- Add a comment explaining the security model
COMMENT ON TABLE public.rental_listings IS 'Rental listings with landlord PII. Direct access restricted to: listing owners, listing admins, staff (admin/owner roles), and CRM users. Public access should use rental_listings_public view.';

-- Grant SELECT on the public view to anon and authenticated roles for public browsing
GRANT SELECT ON public.rental_listings_public TO anon, authenticated;