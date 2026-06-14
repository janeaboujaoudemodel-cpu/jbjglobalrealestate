REVOKE SELECT ON public.broker_2fa_secrets FROM authenticated;
REVOKE SELECT ON public.broker_2fa_secrets FROM anon;
GRANT SELECT (broker_user_id, enabled, enrolled_at, last_verified_at, created_at, updated_at) ON public.broker_2fa_secrets TO authenticated;
GRANT ALL ON public.broker_2fa_secrets TO service_role;

REVOKE SELECT ON public.gmail_tokens FROM authenticated;
REVOKE SELECT ON public.gmail_tokens FROM anon;
GRANT SELECT (id, user_id, email_address, token_expires_at, scopes, is_active, last_sync_at, created_at, updated_at) ON public.gmail_tokens TO authenticated;
GRANT ALL ON public.gmail_tokens TO service_role;