-- =====================================================
-- ADDITIONAL SECURITY HARDENING FOR CRITICAL TABLES
-- =====================================================

-- 1. rental_listings: Public view without landlord contact info
DROP VIEW IF EXISTS public.rental_listings_public;
CREATE VIEW public.rental_listings_public
WITH (security_invoker = on)
AS
SELECT 
  id, property_title, property_type, description, annual_rent,
  emirate, community, building_name, address, bedrooms, bathrooms, size_sqft, 
  amenities, images, video_url, status, furnished, payment_terms, created_at
  -- Excluded: landlord_name, landlord_email, landlord_phone, landlord_nationality
FROM public.rental_listings
WHERE status = 'live';

-- 2. contact_gating_submissions: Strengthen access to owner only
DROP POLICY IF EXISTS "contact_gating_admin_select" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "contact_gating_owner_select" ON public.contact_gating_submissions;

CREATE POLICY "contact_gating_owner_select" ON public.contact_gating_submissions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

-- 3. forms_submissions: Strengthen access to owner only  
DROP POLICY IF EXISTS "forms_vault_select" ON public.forms_submissions;
DROP POLICY IF EXISTS "forms_owner_select" ON public.forms_submissions;

CREATE POLICY "forms_owner_select" ON public.forms_submissions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

-- 4. hr_candidates: Strengthen access
DROP POLICY IF EXISTS "hr_candidates_select" ON public.hr_candidates;
DROP POLICY IF EXISTS "hr_candidates_owner_select" ON public.hr_candidates;

CREATE POLICY "hr_candidates_owner_select" ON public.hr_candidates
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'owner') OR
    EXISTS (
      SELECT 1 FROM public.crm_users_profile
      WHERE user_id = auth.uid()
      AND crm_role IN ('owner_admin', 'founder')
      AND is_active = true
    )
  );

-- 5. new_joiner_applications: Restrict to owner
DROP POLICY IF EXISTS "new_joiner_applications_select" ON public.new_joiner_applications;
DROP POLICY IF EXISTS "new_joiner_owner_select" ON public.new_joiner_applications;

CREATE POLICY "new_joiner_owner_select" ON public.new_joiner_applications
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'owner') OR
    EXISTS (
      SELECT 1 FROM public.crm_users_profile
      WHERE user_id = auth.uid()
      AND crm_role IN ('owner_admin', 'founder')
      AND is_active = true
    )
  );

-- 6. Add indexes for better performance on security checks
CREATE INDEX IF NOT EXISTS idx_crm_users_profile_security ON public.crm_users_profile(user_id, is_active, crm_role);
CREATE INDEX IF NOT EXISTS idx_user_roles_security ON public.user_roles(user_id, role);