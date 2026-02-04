-- Fix contact_gating_submissions security issues

-- 1. Drop overly permissive policies
DROP POLICY IF EXISTS "Rate limited public insert" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "contact_gating_owner_select" ON public.contact_gating_submissions;

-- 2. Add honeypot field for bot detection
ALTER TABLE public.contact_gating_submissions 
ADD COLUMN IF NOT EXISTS honeypot_field text DEFAULT NULL;

-- 3. Create stricter INSERT policy for anonymous users only (with honeypot check)
CREATE POLICY "Anonymous rate-limited insert with honeypot"
ON public.contact_gating_submissions
FOR INSERT
TO anon
WITH CHECK (
  -- Honeypot must be null or empty (bots often fill hidden fields)
  (honeypot_field IS NULL OR honeypot_field = '') AND
  -- Rate limit by email
  check_rate_limit(email, 'contact_gating_email'::text, 5, 60) AND
  -- Rate limit by IP
  check_rate_limit(
    COALESCE((current_setting('request.headers'::text, true)::json->>'x-forwarded-for'), 'unknown'),
    'contact_gating_ip'::text,
    10,
    60
  )
);

-- 4. Create authenticated user insert policy (still with honeypot + rate limiting)
CREATE POLICY "Authenticated rate-limited insert"
ON public.contact_gating_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  (honeypot_field IS NULL OR honeypot_field = '') AND
  check_rate_limit(email, 'contact_gating_email'::text, 5, 60) AND
  check_rate_limit(
    COALESCE((current_setting('request.headers'::text, true)::json->>'x-forwarded-for'), 'unknown'),
    'contact_gating_ip'::text,
    10,
    60
  )
);

-- 5. Add comment for documentation
COMMENT ON COLUMN public.contact_gating_submissions.honeypot_field IS 'Hidden field for bot detection - should always be empty on legitimate submissions';