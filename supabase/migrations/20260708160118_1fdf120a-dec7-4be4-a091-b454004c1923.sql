ALTER TABLE public.cookie_consents
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS policy_version text NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS policy_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS consent_source text NOT NULL DEFAULT 'cookie_banner',
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz NOT NULL DEFAULT now();

GRANT SELECT, INSERT ON public.cookie_consents TO anon;
GRANT SELECT, INSERT ON public.cookie_consents TO authenticated;
GRANT ALL ON public.cookie_consents TO service_role;

DROP POLICY IF EXISTS "Anyone can insert cookie consent" ON public.cookie_consents;
DROP POLICY IF EXISTS "Admins can view cookie consents" ON public.cookie_consents;
DROP POLICY IF EXISTS "Users can view own cookie consent" ON public.cookie_consents;

ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors can record cookie consent"
ON public.cookie_consents
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Signed in users can view their own cookie consents"
ON public.cookie_consents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view cookie consent audit trail"
ON public.cookie_consents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));