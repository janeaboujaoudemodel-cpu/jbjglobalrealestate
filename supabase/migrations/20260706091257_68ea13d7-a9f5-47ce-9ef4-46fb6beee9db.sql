CREATE TABLE IF NOT EXISTS public.home_featured_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  owner_details text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT home_featured_projects_project_unique UNIQUE (project_id)
);

GRANT SELECT ON public.home_featured_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_featured_projects TO authenticated;
GRANT ALL ON public.home_featured_projects TO service_role;

ALTER TABLE public.home_featured_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view visible homepage featured projects" ON public.home_featured_projects;
CREATE POLICY "Public can view visible homepage featured projects"
ON public.home_featured_projects
FOR SELECT
TO anon, authenticated
USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage homepage featured projects" ON public.home_featured_projects;
CREATE POLICY "Admins manage homepage featured projects"
ON public.home_featured_projects
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_home_featured_projects_updated_at ON public.home_featured_projects;
CREATE TRIGGER touch_home_featured_projects_updated_at
BEFORE UPDATE ON public.home_featured_projects
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_home_featured_projects_visible_order
ON public.home_featured_projects (is_visible, display_order, updated_at DESC);