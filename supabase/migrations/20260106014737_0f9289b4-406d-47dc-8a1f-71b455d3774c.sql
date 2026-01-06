-- ================================================
-- TASK 9, 10, 11, 12: Simplify and consolidate RLS policies
-- ================================================

-- First, drop redundant/overlapping policies on evaluation_requests
-- The table has 12+ policies which is overly complex and error-prone

DROP POLICY IF EXISTS "Users can create evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can create own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "eval_insert_own" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view their own evaluation requests by user_id only" ON public.evaluation_requests;
DROP POLICY IF EXISTS "evaluation_requests_select_own_or_admin" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can view all evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can manage all evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can update their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "eval_update_admin_only" ON public.evaluation_requests;
DROP POLICY IF EXISTS "eval_delete_admin_only" ON public.evaluation_requests;

-- Create simplified, consolidated policies for evaluation_requests
CREATE POLICY "evaluation_requests_select" ON public.evaluation_requests
FOR SELECT USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "evaluation_requests_insert" ON public.evaluation_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "evaluation_requests_update" ON public.evaluation_requests
FOR UPDATE USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "evaluation_requests_delete" ON public.evaluation_requests
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ================================================
-- TASK 9: Teams and Projects RLS structure
-- Create teams table and team_members junction table
-- ================================================

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  organization_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_members junction table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team_projects junction table
CREATE TABLE IF NOT EXISTS public.team_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  UNIQUE(team_id, project_id)
);

-- Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_projects ENABLE ROW LEVEL SECURITY;

-- Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(
  _user_id UUID, 
  _team_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

-- Security definer function to check if user is team admin/owner
CREATE OR REPLACE FUNCTION public.is_team_admin(
  _user_id UUID, 
  _team_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Teams RLS policies
CREATE POLICY "teams_select" ON public.teams
FOR SELECT USING (
  is_team_member(auth.uid(), id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "teams_insert" ON public.teams
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "teams_update" ON public.teams
FOR UPDATE USING (
  is_team_admin(auth.uid(), id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "teams_delete" ON public.teams
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = id AND user_id = auth.uid() AND role = 'owner'
  )
  OR has_role(auth.uid(), 'admin')
);

-- Team members RLS policies
CREATE POLICY "team_members_select" ON public.team_members
FOR SELECT USING (
  is_team_member(auth.uid(), team_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "team_members_insert" ON public.team_members
FOR INSERT WITH CHECK (
  is_team_admin(auth.uid(), team_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "team_members_update" ON public.team_members
FOR UPDATE USING (
  is_team_admin(auth.uid(), team_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "team_members_delete" ON public.team_members
FOR DELETE USING (
  is_team_admin(auth.uid(), team_id)
  OR auth.uid() = user_id -- Members can leave teams
  OR has_role(auth.uid(), 'admin')
);

-- Team projects RLS policies - team members only see projects from their teams
CREATE POLICY "team_projects_select" ON public.team_projects
FOR SELECT USING (
  is_team_member(auth.uid(), team_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "team_projects_insert" ON public.team_projects
FOR INSERT WITH CHECK (
  is_team_admin(auth.uid(), team_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "team_projects_delete" ON public.team_projects
FOR DELETE USING (
  is_team_admin(auth.uid(), team_id)
  OR has_role(auth.uid(), 'admin')
);

-- ================================================
-- TASK 10: Multi-tenant organization support
-- ================================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to teams
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Security definer function for organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(
  _user_id UUID, 
  _org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Organizations RLS policies
CREATE POLICY "organizations_select" ON public.organizations
FOR SELECT USING (
  is_org_member(auth.uid(), id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "organizations_insert" ON public.organizations
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "organizations_update" ON public.organizations
FOR UPDATE USING (
  auth.uid() = owner_id
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "organizations_delete" ON public.organizations
FOR DELETE USING (
  auth.uid() = owner_id
  OR has_role(auth.uid(), 'admin')
);

-- Organization members RLS policies
CREATE POLICY "org_members_select" ON public.organization_members
FOR SELECT USING (
  is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "org_members_insert" ON public.organization_members
FOR INSERT WITH CHECK (
  -- Only org owners/admins can add members
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "org_members_delete" ON public.organization_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
  )
  OR auth.uid() = user_id -- Members can leave
  OR has_role(auth.uid(), 'admin')
);

-- Update teams policy to include organization-based access
DROP POLICY IF EXISTS "teams_select" ON public.teams;
CREATE POLICY "teams_select" ON public.teams
FOR SELECT USING (
  is_team_member(auth.uid(), id)
  OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
);

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_projects_team_id ON public.team_projects(team_id);
CREATE INDEX IF NOT EXISTS idx_team_projects_project_id ON public.team_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON public.teams(organization_id);