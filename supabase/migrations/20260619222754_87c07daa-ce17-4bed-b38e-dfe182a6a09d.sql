
-- ============================================================================
-- Storage hardening for three private buckets — close the unscoped-write and
-- unscoped-read gaps flagged by the security scanner.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) briefing-attendance: drop the unscoped SELECT + unscoped INSERT policies
--    and replace with per-user folder scoping. Admin/HR read goes through a
--    role-gated policy using public.has_role().
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth users can view attendance selfies" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attendance selfies" ON storage.objects;

CREATE POLICY "users_view_own_attendance_selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'briefing-attendance'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "admins_view_all_attendance_selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'briefing-attendance'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  )
);

CREATE POLICY "users_upload_own_attendance_selfies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'briefing-attendance'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- 2) documents bucket: drop the two PERMISSIVE bucket-wide write policies that
--    were overriding the per-user scoped ones. The remaining
--    "Users can upload/update their own documents" policies enforce
--    (auth.uid())::text = (storage.foldername(name))[1].
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 3) project-documents bucket: drop unscoped DELETE + INSERT policies.
--    Replace with admin/owner role-gated equivalents so only privileged staff
--    can write to arbitrary paths; service-role policies remain unchanged for
--    edge functions.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_delete_project_docs" ON storage.objects;
DROP POLICY IF EXISTS "auth_upload_project_docs" ON storage.objects;

CREATE POLICY "admin_upload_project_docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  )
);

CREATE POLICY "admin_delete_project_docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::app_role)
  )
);
