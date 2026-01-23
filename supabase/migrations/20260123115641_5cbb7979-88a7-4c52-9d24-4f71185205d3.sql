-- Clean up all existing duplicate policies on referral_partners
DROP POLICY IF EXISTS "Admins can manage referral_partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Admins can read referral partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Partners can view own data only" ON public.referral_partners;
DROP POLICY IF EXISTS "Partners update own profile" ON public.referral_partners;
DROP POLICY IF EXISTS "Partners view own data only" ON public.referral_partners;
DROP POLICY IF EXISTS "Users can manage own referral data" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_insert_auth_only" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_insert_own" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_secure_select" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_secure_update" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_select_auth" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_select_own_or_admin" ON public.referral_partners;
DROP POLICY IF EXISTS "referral_partners_update_own_or_admin" ON public.referral_partners;

-- Create clean, secure RLS policies

-- Partners can only see their own data
CREATE POLICY "partner_select_own"
ON public.referral_partners FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only owner role can see all partner data (not admin - reduces attack surface)
CREATE POLICY "owner_select_all"
ON public.referral_partners FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Partners can insert their own record only
CREATE POLICY "partner_insert_own"
ON public.referral_partners FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Partners can update only their own record
CREATE POLICY "partner_update_own"
ON public.referral_partners FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Only owner can update any partner
CREATE POLICY "owner_update_all"
ON public.referral_partners FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Only owner can delete partners (no admin delete)
CREATE POLICY "owner_delete_only"
ON public.referral_partners FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));