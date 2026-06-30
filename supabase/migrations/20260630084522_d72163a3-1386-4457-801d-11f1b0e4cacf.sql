
-- =========================================================================
-- 1) Replace hardcoded owner email in RLS policies with has_role(...,'owner')
-- =========================================================================

DROP POLICY IF EXISTS "Owner can insert launches" ON public.launch_notifications;
CREATE POLICY "Owner can insert launches"
  ON public.launch_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "owner_writes_broker_activity" ON public.crm_broker_activity_log;
CREATE POLICY "owner_writes_broker_activity"
  ON public.crm_broker_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));


-- =========================================================================
-- 2) broker_email_oauth_apps: stop returning client_secret to the browser
-- =========================================================================
-- Reads already go through public.list_my_broker_oauth_apps() (SECURITY DEFINER,
-- omits client_secret). Removing the table-level SELECT for authenticated makes
-- it impossible to read client_secret via PostgREST even if a new policy is
-- added by mistake. Writes (insert/update/delete) by the owning user are kept.

REVOKE SELECT ON public.broker_email_oauth_apps FROM authenticated;
REVOKE SELECT ON public.broker_email_oauth_apps FROM anon;

-- Server-only helper for backend code (edge functions) that legitimately needs
-- the decrypted secret to perform an OAuth exchange. Locked to service_role.
CREATE OR REPLACE FUNCTION public.get_broker_oauth_app_secret(
  _user_id uuid,
  _provider text
)
RETURNS TABLE (client_id text, client_secret text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id, client_secret
  FROM public.broker_email_oauth_apps
  WHERE user_id = _user_id
    AND provider = _provider
    AND is_active = true
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_broker_oauth_app_secret(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_broker_oauth_app_secret(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_broker_oauth_app_secret(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_broker_oauth_app_secret(uuid, text) TO service_role;


-- =========================================================================
-- 3) gmail_tokens: revoke client SELECT, expose via SECURITY DEFINER RPC
-- =========================================================================
-- The ALL policy currently lets the owning user read raw access/refresh tokens
-- through PostgREST. Replace with explicit insert/update/delete policies and
-- expose token retrieval only via a service-role-only definer function.

DROP POLICY IF EXISTS "Users can manage own gmail tokens" ON public.gmail_tokens;

CREATE POLICY "users_insert_own_gmail_tokens"
  ON public.gmail_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_gmail_tokens"
  ON public.gmail_tokens
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_gmail_tokens"
  ON public.gmail_tokens
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- No SELECT policy on purpose. Also revoke table-level SELECT so PostgREST
-- returns 401 if anyone tries.
REVOKE SELECT ON public.gmail_tokens FROM authenticated;
REVOKE SELECT ON public.gmail_tokens FROM anon;

-- Server-only token reader for edge functions that perform Gmail operations.
CREATE OR REPLACE FUNCTION public.get_my_gmail_token(
  _user_id uuid,
  _email text DEFAULT NULL
)
RETURNS TABLE (
  email_address text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email_address, access_token, refresh_token, token_expires_at, scopes
  FROM public.gmail_tokens
  WHERE user_id = _user_id
    AND is_active = true
    AND (_email IS NULL OR email_address = _email)
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_my_gmail_token(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_gmail_token(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_my_gmail_token(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_gmail_token(uuid, text) TO service_role;
