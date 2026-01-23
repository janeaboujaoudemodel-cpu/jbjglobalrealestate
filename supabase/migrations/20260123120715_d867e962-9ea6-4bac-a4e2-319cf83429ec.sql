-- Fix referral_commissions: remove admin-only, keep owner+partner
DROP POLICY IF EXISTS "Admins can manage all commissions" ON public.referral_commissions;

-- Ensure only owner can manage (not regular admin)
CREATE POLICY "owner_manage_commissions"
ON public.referral_commissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));