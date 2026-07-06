CREATE OR REPLACE FUNCTION public.rel_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(u.email) IN (
        lower(coalesce(current_setting('app.owner_email', true), 'janeaboujaoudenails@gmail.com')),
        'janeaboujaoudemodel@gmail.com',
        'janeaboujaoudenails@gmail.com',
        'contact@janeaboujaoude.net',
        'infoo.jane@gmail.com'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles r
    WHERE r.user_id = auth.uid()
      AND r.role::text IN ('owner','admin','super_admin')
  );
$$;

DROP POLICY IF EXISTS "rel_project_uploads_insert_own_or_owner" ON storage.objects;
CREATE POLICY "rel_project_uploads_insert_own_or_owner"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rel-media'
  AND (
    public.rel_is_owner()
    OR (
      (storage.foldername(name))[1] = 'project-uploads'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "rel_project_uploads_update_own_or_owner" ON storage.objects;
CREATE POLICY "rel_project_uploads_update_own_or_owner"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rel-media'
  AND (
    public.rel_is_owner()
    OR (
      (storage.foldername(name))[1] = 'project-uploads'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
)
WITH CHECK (
  bucket_id = 'rel-media'
  AND (
    public.rel_is_owner()
    OR (
      (storage.foldername(name))[1] = 'project-uploads'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "rel_project_uploads_delete_own_or_owner" ON storage.objects;
CREATE POLICY "rel_project_uploads_delete_own_or_owner"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'rel-media'
  AND (
    public.rel_is_owner()
    OR (
      (storage.foldername(name))[1] = 'project-uploads'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);