-- Remove unscoped voice-samples policies so only the admin-scoped + user-folder-scoped policies remain.
DROP POLICY IF EXISTS "Authenticated users can delete voice samples" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload voice samples" ON storage.objects;