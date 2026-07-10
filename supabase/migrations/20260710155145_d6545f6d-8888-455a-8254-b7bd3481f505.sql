
-- Fix: Prevent anonymous scraping of seller/agent PII on approved portal_listings.
-- 1) Restrict raw table SELECT to owner + admin/owner roles.
-- 2) Recreate portal_listings_public view masking contact_* unless viewer is owner/admin.

DROP POLICY IF EXISTS "Anyone can view approved listings" ON public.portal_listings;

CREATE POLICY "Owners and admins can view their listings"
  ON public.portal_listings FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

REVOKE SELECT ON public.portal_listings FROM anon;

DROP VIEW IF EXISTS public.portal_listings_public;

CREATE VIEW public.portal_listings_public
WITH (security_invoker = true)
AS
SELECT
  id, user_id, listing_type, title, description, location, emirate, area,
  price, currency, bedrooms, bathrooms, area_sqft, property_type,
  furnishing, rent_frequency, cheques, images, title_deed_url,
  status, is_featured, featured_until, use_company_contact,
  -- Mask direct contact PII for anonymous / non-owner viewers.
  CASE WHEN auth.uid() = user_id
       OR public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'owner'::app_role)
       THEN contact_name ELSE NULL END AS contact_name,
  CASE WHEN auth.uid() = user_id
       OR public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'owner'::app_role)
       THEN contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN auth.uid() = user_id
       OR public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'owner'::app_role)
       THEN contact_email ELSE NULL END AS contact_email,
  created_at, updated_at, ai_extracted_data, source_documents,
  gallery_images, floor_plan_images, listing_category, ai_quality_score,
  developer_name, project_name, handover_date, payment_plan,
  amenities, key_features, approved_at, approved_by, rejection_reason,
  view_count, inquiry_count, contact_mode, listing_fee, seller_role,
  approval_status, deleted_at, expires_at, edit_count,
  CASE WHEN auth.uid() = user_id
       OR public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'owner'::app_role)
       THEN passport_copy_url ELSE NULL END AS passport_copy_url
FROM public.portal_listings
WHERE status = 'approved' AND deleted_at IS NULL;

GRANT SELECT ON public.portal_listings_public TO anon, authenticated;
