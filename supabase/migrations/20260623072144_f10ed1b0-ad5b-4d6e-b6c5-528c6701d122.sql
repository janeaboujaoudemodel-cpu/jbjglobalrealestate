-- Prevent sensitive credential/token columns from being returned through the Data API.
-- Existing row-level rules remain in place for ownership/CRM-owner checks.

-- employee_emails: CRM owners may manage mailbox metadata, but must not read password hashes.
REVOKE SELECT ON public.employee_emails FROM anon;
REVOKE SELECT ON public.employee_emails FROM authenticated;
GRANT SELECT (
  id,
  employee_name,
  email_prefix,
  email_address,
  department,
  position,
  quota_mb,
  status,
  created_by,
  notes,
  created_at,
  updated_at
) ON public.employee_emails TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employee_emails TO authenticated;
GRANT ALL ON public.employee_emails TO service_role;

-- gmail_tokens: users may manage their own connection metadata, but must not read OAuth tokens.
REVOKE SELECT ON public.gmail_tokens FROM anon;
REVOKE SELECT ON public.gmail_tokens FROM authenticated;
GRANT SELECT (
  id,
  user_id,
  email_address,
  token_expires_at,
  scopes,
  is_active,
  last_sync_at,
  created_at,
  updated_at
) ON public.gmail_tokens TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gmail_tokens TO authenticated;
GRANT ALL ON public.gmail_tokens TO service_role;

-- instagram_oauth_tokens: users may manage their own account connection, but must not read access tokens.
REVOKE SELECT ON public.instagram_oauth_tokens FROM anon;
REVOKE SELECT ON public.instagram_oauth_tokens FROM authenticated;
GRANT SELECT (
  user_id,
  account_id,
  created_at,
  updated_at
) ON public.instagram_oauth_tokens TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instagram_oauth_tokens TO authenticated;
GRANT ALL ON public.instagram_oauth_tokens TO service_role;