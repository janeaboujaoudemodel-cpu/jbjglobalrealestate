DROP POLICY IF EXISTS app_settings_block_sensitive_keys ON public.app_settings;
CREATE POLICY app_settings_block_sensitive_keys
  ON public.app_settings AS RESTRICTIVE FOR SELECT
  TO anon, authenticated
  USING (key NOT IN ('owner_email'));

REVOKE ALL ON public.broadcast_settings FROM PUBLIC;
REVOKE ALL ON public.broadcast_settings FROM anon;
REVOKE ALL ON public.broadcast_settings FROM authenticated;
COMMENT ON COLUMN public.broadcast_settings.trigger_secret IS
  'Server-only HMAC secret. RLS denies all non-service_role access; no GRANTs exist for anon/authenticated.';

DROP POLICY IF EXISTS broker_self_2fa ON public.broker_2fa_secrets;
DROP POLICY IF EXISTS broker_self_2fa_select ON public.broker_2fa_secrets;
DROP POLICY IF EXISTS broker_self_2fa_modify ON public.broker_2fa_secrets;
DROP POLICY IF EXISTS broker_self_2fa_update ON public.broker_2fa_secrets;

CREATE POLICY broker_self_2fa_modify
  ON public.broker_2fa_secrets FOR INSERT
  TO authenticated
  WITH CHECK (broker_user_id = auth.uid());

CREATE POLICY broker_self_2fa_update
  ON public.broker_2fa_secrets FOR UPDATE
  TO authenticated
  USING (broker_user_id = auth.uid())
  WITH CHECK (broker_user_id = auth.uid());

REVOKE SELECT ON public.broker_2fa_secrets FROM anon, authenticated;

DROP POLICY IF EXISTS broker_select_own_oauth_app ON public.broker_email_oauth_apps;
DROP POLICY IF EXISTS broker_oauth_apps_select_own ON public.broker_email_oauth_apps;
REVOKE SELECT ON public.broker_email_oauth_apps FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_my_broker_oauth_apps()
RETURNS TABLE (
  id uuid,
  provider text,
  client_id text,
  label text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, provider, client_id, label, is_active, created_at, updated_at
  FROM public.broker_email_oauth_apps
  WHERE user_id = auth.uid()
  ORDER BY provider;
$$;

REVOKE ALL ON FUNCTION public.list_my_broker_oauth_apps() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_broker_oauth_apps() TO authenticated;

DROP POLICY IF EXISTS chat_conversations_anon_no_select ON public.chat_conversations;
CREATE POLICY chat_conversations_anon_no_select
  ON public.chat_conversations AS RESTRICTIVE FOR SELECT
  TO anon
  USING (false);

DROP POLICY IF EXISTS email_verifications_owner_select ON public.email_verifications;
REVOKE SELECT ON public.email_verifications FROM anon, authenticated;
GRANT SELECT (id, email, expires_at, verified_at, created_at, attempts)
  ON public.email_verifications TO authenticated;

REVOKE SELECT (access_token, refresh_token) ON public.gmail_tokens FROM anon, authenticated;
REVOKE SELECT (otp_code) ON public.phone_verifications FROM anon, authenticated;