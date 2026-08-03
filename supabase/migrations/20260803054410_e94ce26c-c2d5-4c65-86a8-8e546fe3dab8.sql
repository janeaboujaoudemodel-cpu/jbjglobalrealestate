DROP POLICY IF EXISTS "Users insert own registrations" ON public.developer_registrations;
CREATE POLICY "Users insert own registrations"
ON public.developer_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status IN ('draft'::registration_status, 'submitted'::registration_status)
);

DROP POLICY IF EXISTS "partner_insert_own" ON public.referral_partners;
CREATE POLICY "partner_insert_own"
ON public.referral_partners
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND commission_rate = 5.00
  AND approved_at IS NULL
  AND approved_by IS NULL
);