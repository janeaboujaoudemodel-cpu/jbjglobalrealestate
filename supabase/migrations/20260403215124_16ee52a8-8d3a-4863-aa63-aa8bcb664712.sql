-- ═══════════════════════════════════════════════════════════════
-- 1. Storage: Remove public read on private 'documents' bucket
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public read for documents" ON storage.objects;

-- ═══════════════════════════════════════════════════════════════
-- 2. Storage: Remove public read on private 'listing-staging' bucket
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public read access for listing-staging" ON storage.objects;

CREATE POLICY "listing_staging_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'listing-staging' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════════════════════════════
-- 3. portal_listings: Secure view hiding passport from public
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.portal_listings_public
WITH (security_invoker = false)
AS
SELECT 
  id, user_id, listing_type, title, description, location, emirate, area,
  price, currency, bedrooms, bathrooms, area_sqft, property_type,
  furnishing, rent_frequency, cheques, images, title_deed_url,
  status, is_featured, featured_until, use_company_contact,
  contact_name, contact_phone, contact_email,
  created_at, updated_at, ai_extracted_data, source_documents,
  gallery_images, floor_plan_images, listing_category, ai_quality_score,
  developer_name, project_name, handover_date, payment_plan,
  amenities, key_features, approved_at, approved_by, rejection_reason,
  view_count, inquiry_count, contact_mode, listing_fee, seller_role,
  approval_status, deleted_at, expires_at, edit_count,
  CASE WHEN auth.uid() = user_id 
       OR public.has_role(auth.uid(), 'admin'::app_role) 
       OR public.has_role(auth.uid(), 'owner'::app_role)
  THEN passport_copy_url 
  ELSE NULL 
  END AS passport_copy_url
FROM public.portal_listings;