DROP POLICY IF EXISTS "Anyone can read project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Project documents are viewable by everyone" ON public.project_documents;

CREATE POLICY "Visible project documents are public"
ON public.project_documents
FOR SELECT
USING (
  is_visible = true
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR is_listing_admin(auth.uid())
);