
-- 1. Developers: revoke sensitive columns from anon
REVOKE SELECT (admin_email, office_phone, whatsapp, notes) ON public.developers FROM anon;

-- 2. CRM profile: prevent self role escalation
DROP POLICY IF EXISTS "crm_users_profile_update_own" ON public.crm_users_profile;
CREATE POLICY "crm_users_profile_update_own"
  ON public.crm_users_profile
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND crm_role = (SELECT crm_role FROM public.crm_users_profile WHERE user_id = auth.uid())
    AND is_active = (SELECT is_active FROM public.crm_users_profile WHERE user_id = auth.uid())
  );

-- 3. Customer reviews: enforce user_id matches auth.uid (or null for anonymous flag)
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.customer_reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON public.customer_reviews
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- 4. Flip SECURITY DEFINER views to security_invoker
ALTER VIEW public.customer_reviews_public SET (security_invoker = on);
ALTER VIEW public.profiles_public SET (security_invoker = on);

-- 5. Fix mutable search_path on user-defined function
ALTER FUNCTION public.enforce_project_image_url_is_http() SET search_path = public;
