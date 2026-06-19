
-- 1) broker_email_oauth_apps: hide client_secret from any API SELECT.
-- Keep INSERT/UPDATE access so brokers can save credentials; reads of client_secret
-- happen only inside SECURITY DEFINER functions (e.g. public.get_broker_oauth_app).
REVOKE SELECT ON public.broker_email_oauth_apps FROM authenticated;
REVOKE SELECT ON public.broker_email_oauth_apps FROM anon;
GRANT SELECT (id, user_id, provider, client_id, label, is_active, created_at, updated_at)
  ON public.broker_email_oauth_apps TO authenticated;
GRANT INSERT (user_id, provider, client_id, client_secret, label, is_active),
      UPDATE (provider, client_id, client_secret, label, is_active, updated_at)
  ON public.broker_email_oauth_apps TO authenticated;

-- 2) it_provisioning_records: drop plaintext temporary_password column entirely.
-- The password is delivered to the new joiner via the welcome email by the
-- provision-employee-account edge function and is never needed in the DB.
ALTER TABLE public.it_provisioning_records
  DROP COLUMN IF EXISTS temporary_password;
