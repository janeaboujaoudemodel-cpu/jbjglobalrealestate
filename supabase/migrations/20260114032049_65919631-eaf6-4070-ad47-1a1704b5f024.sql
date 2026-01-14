-- SECURITY FIX: Secure banking columns via the referral_partners_secure view
-- The view already exists and masks banking data - we need to ensure the main table 
-- banking columns are not exposed directly via RLS

-- Drop any overly permissive policies on referral_partners
DROP POLICY IF EXISTS "Anyone can view referral partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Public can view referral partners" ON public.referral_partners;

-- Revoke direct table access from anon to force use of secure view or RPC functions
REVOKE SELECT ON public.referral_partners FROM anon;

-- Add strict column-level security via RLS (only owners see their own banking data)
DROP POLICY IF EXISTS "Users can view own referral data" ON public.referral_partners;
DROP POLICY IF EXISTS "Users can view own referral_partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Users can view their own partner profile" ON public.referral_partners;

-- Single consolidated SELECT policy for partners
CREATE POLICY "Partners can view own data only"
ON public.referral_partners
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add comment documenting the security setup
COMMENT ON TABLE public.referral_partners IS 'Partner data with banking info - protected by RLS. Banking columns exist for RPC access only via get_partner_banking_details(). Direct table access returns only own data.';

-- Ensure profiles table has no public exposure
REVOKE SELECT ON public.profiles FROM anon;