-- is_admin_or_owner() referenced 'super_admin', which is not a member of the
-- app_role enum -> every call raised "invalid input value for enum app_role",
-- aborting broker_subscriptions updates for all signed-in users.
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'owner'::app_role)
  );
END;
$$;

-- Inside a SECURITY DEFINER function current_user is the function owner, so it
-- can never be used to detect the caller. Use the `role` GUC (set by PostgREST
-- via SET ROLE) instead.
CREATE OR REPLACE FUNCTION public.jbj_caller_is_privileged()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text := COALESCE(current_setting('role', true), '');
BEGIN
  IF r IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN true;
  END IF;
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN true;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'owner'::app_role);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;