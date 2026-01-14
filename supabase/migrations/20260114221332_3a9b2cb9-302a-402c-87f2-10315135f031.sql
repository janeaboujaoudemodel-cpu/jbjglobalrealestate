-- Create listing_admin role enum value if not exists
DO $$
BEGIN
  -- Check if 'listing_admin' value exists in app_role enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'listing_admin' 
    AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'listing_admin';
  END IF;
END $$;

-- Create table to track listing admin users (separate from user_roles for focused management)
CREATE TABLE IF NOT EXISTS public.listing_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  assigned_by_user_id uuid,
  assigned_at timestamptz DEFAULT now(),
  last_active_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_admins ENABLE ROW LEVEL SECURITY;

-- RLS policies for listing_admins table
CREATE POLICY "CRM admins can manage listing admins"
  ON public.listing_admins FOR ALL
  USING (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Listing admins can view own record"
  ON public.listing_admins FOR SELECT
  USING (auth.uid() = user_id);

-- Function to check if user is a listing admin
CREATE OR REPLACE FUNCTION public.is_listing_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listing_admins
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Update projects table RLS to allow listing admins
DROP POLICY IF EXISTS "Enable read access for all" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;

CREATE POLICY "Anyone can read projects"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Admins and listing admins can manage projects"
  ON public.projects FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_listing_admin(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_listing_admin(auth.uid())
  );

-- Update project_documents RLS to allow listing admins
DROP POLICY IF EXISTS "Public read for project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Admins can manage project documents" ON public.project_documents;

CREATE POLICY "Anyone can read project documents"
  ON public.project_documents FOR SELECT
  USING (true);

CREATE POLICY "Admins and listing admins can manage project documents"
  ON public.project_documents FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_listing_admin(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_listing_admin(auth.uid())
  );

-- Update project_images RLS to allow listing admins
DROP POLICY IF EXISTS "Enable read access for all users" ON public.project_images;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.project_images;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.project_images;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.project_images;

CREATE POLICY "Anyone can read project images"
  ON public.project_images FOR SELECT
  USING (true);

CREATE POLICY "Admins and listing admins can manage project images"
  ON public.project_images FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_listing_admin(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_listing_admin(auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_listing_admins_updated_at
  BEFORE UPDATE ON public.listing_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();