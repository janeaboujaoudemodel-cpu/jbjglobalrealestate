DROP POLICY IF EXISTS "Public can view visible homepage featured projects" ON public.home_featured_projects;
CREATE POLICY "Public can view visible homepage featured projects"
ON public.home_featured_projects
FOR SELECT
TO anon, authenticated
USING (
  is_visible = true
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP POLICY IF EXISTS "Admins manage homepage featured projects" ON public.home_featured_projects;
CREATE POLICY "Owners manage homepage featured projects"
ON public.home_featured_projects
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);