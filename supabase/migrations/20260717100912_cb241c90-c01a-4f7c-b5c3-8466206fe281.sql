CREATE POLICY "Developer editors can update assigned developers"
ON public.developers
FOR UPDATE
TO authenticated
USING (public.has_developer_edit_access(id))
WITH CHECK (public.has_developer_edit_access(id));