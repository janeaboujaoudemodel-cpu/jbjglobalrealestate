
-- 1. broker_2fa_secrets: add self SELECT policy
CREATE POLICY "broker_self_2fa_select" ON public.broker_2fa_secrets
  FOR SELECT TO authenticated
  USING (broker_user_id = auth.uid());

-- 2. email_verifications: ensure no client reads possible (revoke privileges)
REVOKE SELECT ON public.email_verifications FROM anon, authenticated;

-- 3. phone_verifications: remove admin SELECT exposing plaintext OTP; keep service-role only
DROP POLICY IF EXISTS "Admins can view phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "phone_verifications_admin_only" ON public.phone_verifications;
DROP POLICY IF EXISTS "phone_verifications_admin_all" ON public.phone_verifications;
REVOKE SELECT ON public.phone_verifications FROM anon, authenticated;

-- 4. resale_listings: restrict SELECT to the owning investor only (no admin/owner plaintext PII access via RLS)
DROP POLICY IF EXISTS "resale_listings_owner_admin_select" ON public.resale_listings;
CREATE POLICY "resale_listings_self_select" ON public.resale_listings
  FOR SELECT TO authenticated
  USING (investor_user_id = auth.uid());

-- 5. developer_launch_uploads: require authentication
DROP POLICY IF EXISTS "Anyone can submit launch uploads" ON public.developer_launch_uploads;
REVOKE INSERT ON public.developer_launch_uploads FROM anon;
CREATE POLICY "Authenticated users can submit launch uploads" ON public.developer_launch_uploads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. launch_interest_registrations: replace hardcoded UUID with has_role check
DROP POLICY IF EXISTS "Owner can view all interest" ON public.launch_interest_registrations;
CREATE POLICY "Owner can view all interest" ON public.launch_interest_registrations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR user_id = auth.uid());

-- 7. Fix search_path on trg_vault_touch_updated_at
CREATE OR REPLACE FUNCTION public.trg_vault_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END
$function$;
