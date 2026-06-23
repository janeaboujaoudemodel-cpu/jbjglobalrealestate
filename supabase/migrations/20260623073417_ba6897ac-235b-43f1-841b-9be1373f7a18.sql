
-- 1) Rate-limit anonymous book download submissions
DROP POLICY IF EXISTS "Anyone can insert book downloads" ON public.book_downloads;
CREATE POLICY "book_downloads_rate_limited_insert"
ON public.book_downloads FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), 'unknown'),
    'book_download', 5, 60
  )
  AND downloader_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- 2) Rate-limit anonymous matchmaker submissions
DROP POLICY IF EXISTS "anyone_can_submit_matchmaker" ON public.matchmaker_submissions;
CREATE POLICY "matchmaker_rate_limited_insert"
ON public.matchmaker_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), 'unknown'),
    'matchmaker_submission', 3, 60
  )
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- 3) Hide OAuth client_secret from PostgREST clients (service_role keeps full access)
REVOKE SELECT (client_secret) ON public.broker_email_oauth_apps FROM anon, authenticated;

-- 4) Hide employee password_hash from CRM owners / clients
REVOKE SELECT (password_hash), UPDATE (password_hash) ON public.employee_emails FROM anon, authenticated;

-- 5) Hide Gmail OAuth tokens from clients
REVOKE SELECT (access_token, refresh_token) ON public.gmail_tokens FROM anon, authenticated;

-- 6) Hide raw banking ciphertext from partner clients; only server-side roles may read
REVOKE SELECT (bank_iban_encrypted, bank_name_encrypted, bank_account_encrypted)
  ON public.referral_partner_banking FROM anon, authenticated;
