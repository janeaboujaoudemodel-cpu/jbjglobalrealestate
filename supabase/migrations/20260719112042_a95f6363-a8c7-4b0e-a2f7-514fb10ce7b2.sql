CREATE POLICY "owner_reports_owner_admin_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'owner-reports' AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')))
WITH CHECK (bucket_id = 'owner-reports' AND (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')));