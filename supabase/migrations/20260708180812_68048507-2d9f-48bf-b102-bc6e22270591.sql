
-- 1. Restrict overly-permissive storage INSERT policies on public buckets.
-- These previously had role=public with only bucket_id checks, effectively
-- letting any anon/authenticated user upload arbitrary files.
DROP POLICY IF EXISTS "Service role can upload area images" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload for area images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload developer logos" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload for news images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload podcast audio" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload project-media" ON storage.objects;
DROP POLICY IF EXISTS "ig_grid_auth_insert" ON storage.objects;

-- Restrict area-images / developer-logos / news-images / podcast-audio / project-media
-- to admin/owner/listing_admin uploads only (service_role already bypasses RLS).
CREATE POLICY "Admins can upload area images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'area-images'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'listing_admin'::app_role))
  );

CREATE POLICY "Admins can upload developer logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'developer-logos'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'listing_admin'::app_role))
  );

CREATE POLICY "Admins can upload news images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'news-images'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'listing_admin'::app_role))
  );

CREATE POLICY "Admins can upload podcast audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'podcast-audio'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  );

CREATE POLICY "Admins can upload project media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-media'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'listing_admin'::app_role))
  );

CREATE POLICY "Admins can upload instagram grid photos scoped"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'instagram-grid-photos'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'listing_admin'::app_role))
  );

-- 2. Contact gating: purge plaintext PII columns (encrypted columns already exist).
UPDATE public.contact_gating_submissions
   SET full_name = NULL, email = NULL, phone = NULL
 WHERE full_name IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL;
