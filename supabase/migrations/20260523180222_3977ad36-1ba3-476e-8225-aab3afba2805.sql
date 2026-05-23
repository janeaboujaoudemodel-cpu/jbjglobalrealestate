
-- 1. Remove anon INSERT on email_verifications (OTPs created server-side via edge functions using service role)
DROP POLICY IF EXISTS "Validated public email verification creation" ON public.email_verifications;

-- 2. listing-documents bucket: restrict to authenticated owners; path is `${auth.uid()}/listings/...`
DROP POLICY IF EXISTS "Anyone can view listing documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload listing documents" ON storage.objects;

CREATE POLICY "Owners view their own listing documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listing-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners upload their own listing documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners update their own listing documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. meeting-booking-attachments: path-scope uploads to 'bookings/' folder, cap size via extension allowlist
DROP POLICY IF EXISTS "Public can upload meeting booking attachments" ON storage.objects;

CREATE POLICY "Public uploads scoped to bookings folder"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'meeting-booking-attachments'
    AND (storage.foldername(name))[1] = 'bookings'
    AND lower(substring(name FROM '\.([^\.]+)$')) IN
      ('pdf','jpg','jpeg','png','webp','doc','docx','xls','xlsx','ppt','pptx','txt','csv')
  );

-- 4. Move Instagram OAuth access tokens to a separate service-role-only readable table
CREATE TABLE IF NOT EXISTS public.instagram_oauth_tokens (
  user_id uuid NOT NULL,
  account_id text NOT NULL,
  access_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, account_id)
);

ALTER TABLE public.instagram_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Owners can write their own tokens; no SELECT policy means clients cannot read them back.
CREATE POLICY "Users insert their own ig tokens"
  ON public.instagram_oauth_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own ig tokens"
  ON public.instagram_oauth_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own ig tokens"
  ON public.instagram_oauth_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Migrate existing tokens from instagram_scheduled_posts (most-recent token per account wins)
INSERT INTO public.instagram_oauth_tokens (user_id, account_id, access_token, created_at, updated_at)
SELECT DISTINCT ON (user_id, account_id)
  user_id, account_id, access_token, now(), now()
FROM public.instagram_scheduled_posts
WHERE access_token IS NOT NULL
  AND account_id IS NOT NULL
  AND user_id IS NOT NULL
ORDER BY user_id, account_id, created_at DESC
ON CONFLICT (user_id, account_id) DO NOTHING;

-- Drop the plaintext token column from the client-readable table
ALTER TABLE public.instagram_scheduled_posts DROP COLUMN IF EXISTS access_token;

-- 5. it_provisioning_records: clear temporary_password once welcome email is delivered
UPDATE public.it_provisioning_records
SET temporary_password = NULL
WHERE welcome_email_sent = true
  AND temporary_password IS NOT NULL;

CREATE OR REPLACE FUNCTION public.clear_it_temp_password_on_send()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.welcome_email_sent IS TRUE THEN
    NEW.temporary_password := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_it_temp_password ON public.it_provisioning_records;
CREATE TRIGGER trg_clear_it_temp_password
  BEFORE INSERT OR UPDATE ON public.it_provisioning_records
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_it_temp_password_on_send();
