-- =====================================================
-- FIX: Landlord PII Protection via Role-Based Access
-- Only authorized users can see landlord contact details
-- =====================================================

-- 1. Create security definer function to check landlord PII access
CREATE OR REPLACE FUNCTION public.can_view_landlord_pii(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check for admin/owner role (executives can always see PII)
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role IN ('admin', 'owner')
  ) OR EXISTS (
    -- Check for listing admin permission
    SELECT 1 FROM public.listing_admins
    WHERE user_id = _user_id
    AND is_active = true
  ) OR EXISTS (
    -- Check for owner_admin, admin, or founder CRM role
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = _user_id 
    AND is_active = true
    AND crm_role IN ('owner_admin', 'admin', 'founder')
  )
$$;

-- 2. Create secure view that masks landlord PII for unauthorized users
DROP VIEW IF EXISTS public.v_rental_listings_safe;
CREATE VIEW public.v_rental_listings_safe
WITH (security_invoker = on)
AS
SELECT 
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
  -- Mask landlord PII unless user has permission
  CASE 
    WHEN public.can_view_landlord_pii(auth.uid()) THEN landlord_name
    ELSE '••• Protected •••'
  END as landlord_name,
  CASE 
    WHEN public.can_view_landlord_pii(auth.uid()) THEN landlord_email
    ELSE '••• Protected •••'
  END as landlord_email,
  CASE 
    WHEN public.can_view_landlord_pii(auth.uid()) THEN landlord_phone
    ELSE '••• Protected •••'
  END as landlord_phone,
  CASE 
    WHEN public.can_view_landlord_pii(auth.uid()) THEN landlord_nationality
    ELSE NULL
  END as landlord_nationality,
  ownership_type,
  images,
  documents,
  video_url,
  description,
  amenities,
  status,
  rejection_reason,
  admin_approved_at,
  admin_approved_by,
  assistant_approved_at,
  assistant_approved_by,
  founder_approved_at,
  founder_approved_by,
  went_live_at,
  created_at,
  updated_at,
  leadership_approved_at,
  leadership_approved_by
FROM public.rental_listings;

-- 3. Update the problematic "CRM users can view rental listings" policy
-- Replace with a more restrictive policy that only allows listing admins
DROP POLICY IF EXISTS "CRM users can view rental listings" ON public.rental_listings;

-- Create new restrictive policy - only listing admins can access base table
CREATE POLICY "Listing admins can view rental listings"
ON public.rental_listings FOR SELECT
USING (
  -- Listing admins have full access
  public.is_listing_admin(auth.uid())
  OR
  -- Owner/admin roles have full access
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
  OR
  -- CRM owner_admin/admin/founder roles have full access
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND crm_role IN ('owner_admin', 'admin', 'founder')
  )
);

-- 4. Grant access to the safe view for all authenticated users
GRANT SELECT ON public.v_rental_listings_safe TO authenticated;

-- 5. Add documentation
COMMENT ON VIEW public.v_rental_listings_safe IS 'Secure view for rental listings that masks landlord PII (name, email, phone, nationality). Regular CRM users should query this view. Only listing admins and executives can see the unmasked data.';
COMMENT ON FUNCTION public.can_view_landlord_pii IS 'Checks if user has permission to view landlord contact details. Returns true for: admin/owner roles, listing_admins, or CRM owner_admin/admin/founder roles.';