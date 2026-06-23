-- Harden broker_2fa_secrets: remove owner-wide table access to TOTP secrets.
DROP POLICY IF EXISTS owner_full_2fa ON public.broker_2fa_secrets;

CREATE OR REPLACE FUNCTION public.owner_disable_broker_2fa(_broker_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'owner'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.broker_2fa_secrets
  SET enabled = false,
      secret = NULL,
      recovery_codes_hash = NULL,
      updated_at = now()
  WHERE broker_user_id = _broker_user_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_disable_broker_2fa(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_disable_broker_2fa(uuid) TO authenticated;

-- Harden broker_email_oauth_apps: admin/owner may not read all plaintext client_secret values via Data API.
DROP POLICY IF EXISTS owner_select_own_oauth_app ON public.broker_email_oauth_apps;
DROP POLICY IF EXISTS owner_delete_own_oauth_app ON public.broker_email_oauth_apps;

CREATE POLICY broker_select_own_oauth_app
ON public.broker_email_oauth_apps
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY broker_delete_own_oauth_app
ON public.broker_email_oauth_apps
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Harden email_verifications: no admin/owner read access to plaintext OTP codes through table policies.
DROP POLICY IF EXISTS "Admins can view email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Admins can view verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "System can manage verifications" ON public.email_verifications;
DROP POLICY IF EXISTS email_verifications_admin_all ON public.email_verifications;
DROP POLICY IF EXISTS email_verifications_admin_only ON public.email_verifications;

CREATE OR REPLACE FUNCTION public.verify_email_otp(_email text, _otp_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _verification_id uuid;
BEGIN
  SELECT id INTO _verification_id
  FROM public.email_verifications
  WHERE lower(email) = lower(_email)
    AND otp_code = _otp_code
    AND verified_at IS NULL
    AND expires_at > now()
    AND attempts < 5
  ORDER BY created_at DESC
  LIMIT 1;

  UPDATE public.email_verifications
  SET attempts = attempts + 1
  WHERE lower(email) = lower(_email)
    AND verified_at IS NULL
    AND expires_at > now()
    AND attempts < 5;

  IF _verification_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.email_verifications
  SET verified_at = now()
  WHERE id = _verification_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_email_otp(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_email_otp(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_otp(text, text) TO anon;