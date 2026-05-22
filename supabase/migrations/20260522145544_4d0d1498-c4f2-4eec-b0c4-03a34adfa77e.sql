
DROP POLICY IF EXISTS "Anyone can read projects" ON public.projects;
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;

CREATE POLICY "Public reads exclude soft-deleted"
  ON public.projects
  FOR SELECT
  USING (
    deleted_at IS NULL
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
    OR is_listing_admin(auth.uid())
  );
