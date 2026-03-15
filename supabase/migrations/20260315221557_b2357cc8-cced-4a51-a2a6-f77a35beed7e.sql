-- ═══════════════════════════════════════════════════════
-- BATCH 1: Make 6 sensitive public buckets PRIVATE
-- ═══════════════════════════════════════════════════════

UPDATE storage.buckets SET public = false WHERE id IN (
  'assistant-files',
  'brand-assets',
  'briefing-attendance',
  'esign-certificates',
  'listing-staging',
  'voice-samples'
);

-- ═══════════════════════════════════════════════════════
-- BATCH 2: Drop overly permissive public read policies
-- ═══════════════════════════════════════════════════════

-- broker-documents: already private but has a wide-open public read
DROP POLICY IF EXISTS "Public can read broker docs" ON storage.objects;

-- project-documents: already private but has a wide-open public read
DROP POLICY IF EXISTS "Public can read project docs" ON storage.objects;

-- voice-samples: public view should be auth-gated now
DROP POLICY IF EXISTS "Public can view voice samples" ON storage.objects;

-- briefing-attendance: public view should be auth-gated
DROP POLICY IF EXISTS "Public can view attendance selfies" ON storage.objects;

-- assistant-files: public view should be scoped to owner only (existing user-scoped policy remains)
DROP POLICY IF EXISTS "Public can view assistant files" ON storage.objects;

-- esign-certificates: public read should be auth-gated
DROP POLICY IF EXISTS "esign_certs_public_read" ON storage.objects;

-- ═══════════════════════════════════════════════════════
-- BATCH 3: Replace with auth-gated read policies
-- ═══════════════════════════════════════════════════════

-- broker-documents: admins/owners can read all, brokers read own (existing policy handles own)
CREATE POLICY "Admins can read all broker docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'broker-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'owner')
    )
  );

-- project-documents: authenticated users can read
CREATE POLICY "Authenticated can read project docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-documents'
    AND auth.role() = 'authenticated'
  );

-- voice-samples: only owner/admin can read all, users read own
CREATE POLICY "Auth users can view voice samples"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-samples'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'owner')
    )
  );

-- briefing-attendance: authenticated users can view (for briefing UI)
CREATE POLICY "Auth users can view attendance selfies"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'briefing-attendance'
    AND auth.role() = 'authenticated'
  );

-- esign-certificates: only document owner or admin
CREATE POLICY "Auth users can view esign certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'esign-certificates'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'owner')
    )
  );

-- listing-staging: users can read own staging files
CREATE POLICY "Users can read own listing staging"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'listing-staging'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'owner')
    )
  );