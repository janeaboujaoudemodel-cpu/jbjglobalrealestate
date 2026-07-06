-- Extend home_featured_projects with per-device slots and add manual featured projects table

ALTER TABLE public.home_featured_projects
  ADD COLUMN IF NOT EXISTS device text NOT NULL DEFAULT 'desktop',
  ADD COLUMN IF NOT EXISTS manual_project_id uuid NULL;

ALTER TABLE public.home_featured_projects
  DROP CONSTRAINT IF EXISTS home_featured_projects_device_check;
ALTER TABLE public.home_featured_projects
  ADD CONSTRAINT home_featured_projects_device_check CHECK (device IN ('mobile','tablet','desktop'));

-- Allow project_id to be null when using a manual project
ALTER TABLE public.home_featured_projects
  ALTER COLUMN project_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS home_featured_projects_device_order_idx
  ON public.home_featured_projects (device, display_order);

-- Manual (owner-authored) featured projects that don't exist in projects yet
CREATE TABLE IF NOT EXISTS public.home_featured_manual_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  developer_name text NULL,
  emirate text NULL,
  community text NULL,
  starting_price text NULL,
  hero_image_url text NULL,
  cta_url text NULL,
  owner_details text NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_featured_manual_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_featured_manual_projects TO authenticated;
GRANT ALL ON public.home_featured_manual_projects TO service_role;

ALTER TABLE public.home_featured_manual_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read manual featured projects" ON public.home_featured_manual_projects;
CREATE POLICY "Public can read manual featured projects"
  ON public.home_featured_manual_projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners can manage manual featured projects" ON public.home_featured_manual_projects;
CREATE POLICY "Owners can manage manual featured projects"
  ON public.home_featured_manual_projects FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_home_featured_manual_projects_updated_at ON public.home_featured_manual_projects;
CREATE TRIGGER update_home_featured_manual_projects_updated_at
  BEFORE UPDATE ON public.home_featured_manual_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();