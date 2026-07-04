
-- 1. Contact gating: remove plaintext PII, block future plaintext writes
UPDATE public.contact_gating_submissions
  SET email = NULL, phone = NULL, full_name = NULL
  WHERE email IS NOT NULL OR phone IS NOT NULL OR full_name IS NOT NULL;

ALTER TABLE public.contact_gating_submissions
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN email SET DEFAULT NULL,
  ALTER COLUMN phone SET DEFAULT NULL,
  ALTER COLUMN full_name SET DEFAULT NULL;

ALTER TABLE public.contact_gating_submissions
  DROP CONSTRAINT IF EXISTS contact_gating_no_plaintext_pii;
ALTER TABLE public.contact_gating_submissions
  ADD CONSTRAINT contact_gating_no_plaintext_pii
  CHECK (email IS NULL AND phone IS NULL AND full_name IS NULL);

-- 2. Chat conversations: remove spoofable anonymous UPDATE policy
DROP POLICY IF EXISTS chat_conversations_anon_self_update ON public.chat_conversations;

-- 3. Storage: restrict public-bucket uploads to admin/listing_admin roles
DROP POLICY IF EXISTS "Authenticated upload instagram grid photos" ON storage.objects;
CREATE POLICY "Admins can upload instagram grid photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'instagram-grid-photos'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'listing_admin'))
  );

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Admins can upload videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'listing_admin'))
  );
