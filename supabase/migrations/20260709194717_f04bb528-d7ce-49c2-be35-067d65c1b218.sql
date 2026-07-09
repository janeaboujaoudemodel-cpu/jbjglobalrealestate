-- Remove broad public/full-row access to broker_profiles.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.broker_profiles FROM anon;

DROP POLICY IF EXISTS broker_profiles_public_select ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can view own broker profile" ON public.broker_profiles;

CREATE POLICY "Users can view own broker profile"
ON public.broker_profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.is_crm_admin(auth.uid())
);

-- Ensure the safe public directory view remains accessible without exposing email,
-- phone, identity documents, or RERA document URLs from the base table.
GRANT SELECT ON public.broker_profiles_public TO anon, authenticated;
GRANT ALL ON public.broker_profiles_public TO service_role;