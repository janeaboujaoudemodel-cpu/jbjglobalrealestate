
-- 0a. Drop role-based policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname='public'
             AND tablename IN ('organizations','organization_members','teams','team_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 0b. Drop legacy CHECK constraints
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

-- 0c. Drop conflicting helper functions (param names differ)
DROP FUNCTION IF EXISTS public.is_org_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_team_member(uuid, uuid) CASCADE;

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.org_role AS ENUM ('owner','admin','manager','member','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.team_role AS ENUM ('lead','member','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.org_permission AS ENUM (
    'org.manage','org.billing.manage',
    'members.manage','teams.manage','invitations.manage',
    'crm.leads.read','crm.leads.write','crm.leads.delete',
    'crm.contacts.read','crm.contacts.write',
    'crm.accounts.read','crm.accounts.write',
    'crm.deals.read','crm.deals.write',
    'crm.tasks.read','crm.tasks.write',
    'crm.reports.read','crm.analytics.read',
    'crm.settings.manage','crm.export'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Convert text roles → enums
ALTER TABLE public.organization_members
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.org_role
    USING (CASE lower(coalesce(role,'member'))
             WHEN 'owner' THEN 'owner'::public.org_role
             WHEN 'admin' THEN 'admin'::public.org_role
             WHEN 'manager' THEN 'manager'::public.org_role
             WHEN 'viewer' THEN 'viewer'::public.org_role
             ELSE 'member'::public.org_role END),
  ALTER COLUMN role SET DEFAULT 'member'::public.org_role;

ALTER TABLE public.team_members
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.team_role
    USING (CASE lower(coalesce(role,'member'))
             WHEN 'lead' THEN 'lead'::public.team_role
             WHEN 'viewer' THEN 'viewer'::public.team_role
             ELSE 'member'::public.team_role END),
  ALTER COLUMN role SET DEFAULT 'member'::public.team_role;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_members_org_user
  ON public.organization_members(organization_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_members_team_user
  ON public.team_members(team_id, user_id);

-- 3. role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.org_role NOT NULL,
  permission public.org_permission NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_permissions readable by authenticated" ON public.role_permissions;
CREATE POLICY "role_permissions readable by authenticated"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

INSERT INTO public.role_permissions(role, permission)
SELECT r::public.org_role, p::public.org_permission FROM (VALUES
  ('owner','org.manage'),('owner','org.billing.manage'),('owner','members.manage'),
  ('owner','teams.manage'),('owner','invitations.manage'),
  ('owner','crm.leads.read'),('owner','crm.leads.write'),('owner','crm.leads.delete'),
  ('owner','crm.contacts.read'),('owner','crm.contacts.write'),
  ('owner','crm.accounts.read'),('owner','crm.accounts.write'),
  ('owner','crm.deals.read'),('owner','crm.deals.write'),
  ('owner','crm.tasks.read'),('owner','crm.tasks.write'),
  ('owner','crm.reports.read'),('owner','crm.analytics.read'),
  ('owner','crm.settings.manage'),('owner','crm.export'),
  ('admin','org.manage'),('admin','members.manage'),('admin','teams.manage'),
  ('admin','invitations.manage'),
  ('admin','crm.leads.read'),('admin','crm.leads.write'),('admin','crm.leads.delete'),
  ('admin','crm.contacts.read'),('admin','crm.contacts.write'),
  ('admin','crm.accounts.read'),('admin','crm.accounts.write'),
  ('admin','crm.deals.read'),('admin','crm.deals.write'),
  ('admin','crm.tasks.read'),('admin','crm.tasks.write'),
  ('admin','crm.reports.read'),('admin','crm.analytics.read'),
  ('admin','crm.settings.manage'),('admin','crm.export'),
  ('manager','teams.manage'),
  ('manager','crm.leads.read'),('manager','crm.leads.write'),
  ('manager','crm.contacts.read'),('manager','crm.contacts.write'),
  ('manager','crm.accounts.read'),('manager','crm.accounts.write'),
  ('manager','crm.deals.read'),('manager','crm.deals.write'),
  ('manager','crm.tasks.read'),('manager','crm.tasks.write'),
  ('manager','crm.reports.read'),('manager','crm.analytics.read'),
  ('manager','crm.export'),
  ('member','crm.leads.read'),('member','crm.leads.write'),
  ('member','crm.contacts.read'),('member','crm.contacts.write'),
  ('member','crm.accounts.read'),('member','crm.accounts.write'),
  ('member','crm.deals.read'),('member','crm.deals.write'),
  ('member','crm.tasks.read'),('member','crm.tasks.write'),
  ('member','crm.reports.read'),
  ('viewer','crm.leads.read'),('viewer','crm.contacts.read'),
  ('viewer','crm.accounts.read'),('viewer','crm.deals.read'),
  ('viewer','crm.tasks.read'),('viewer','crm.reports.read'),('viewer','crm.analytics.read')
) AS t(r,p)
ON CONFLICT (role, permission) DO NOTHING;

-- 4. Active org per user
CREATE TABLE IF NOT EXISTS public.user_current_org (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_current_org TO authenticated;
GRANT ALL ON public.user_current_org TO service_role;
ALTER TABLE public.user_current_org ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "current_org self read" ON public.user_current_org;
DROP POLICY IF EXISTS "current_org self upsert" ON public.user_current_org;
DROP POLICY IF EXISTS "current_org self update" ON public.user_current_org;
DROP POLICY IF EXISTS "current_org self delete" ON public.user_current_org;
CREATE POLICY "current_org self read" ON public.user_current_org
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "current_org self upsert" ON public.user_current_org
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "current_org self update" ON public.user_current_org
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "current_org self delete" ON public.user_current_org
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5. Invitations
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.organization_invitations(email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- 6. Helpers
CREATE OR REPLACE FUNCTION public.is_org_member(_org UUID, _user UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.get_org_role(_org UUID, _user UUID DEFAULT auth.uid())
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_members WHERE organization_id = _org AND user_id = _user LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org UUID, _role public.org_role, _user UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = _user AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_org_permission(_org UUID, _perm public.org_permission, _user UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    JOIN public.role_permissions rp ON rp.role = m.role
    WHERE m.organization_id = _org AND m.user_id = _user AND rp.permission = _perm
  );
$$;

CREATE OR REPLACE FUNCTION public.current_org_id(_user UUID DEFAULT auth.uid())
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.user_current_org WHERE user_id = _user LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_team UUID, _user UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team AND user_id = _user);
$$;

-- 7. RLS rebuild
CREATE POLICY "org members can view org" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "authenticated can create org" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "admins can update org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.has_org_permission(id,'org.manage'::public.org_permission))
  WITH CHECK (public.has_org_permission(id,'org.manage'::public.org_permission));
CREATE POLICY "owner can delete org" ON public.organizations
  FOR DELETE TO authenticated USING (public.has_org_role(id,'owner'::public.org_role));

CREATE POLICY "members can view roster" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "admins can manage members" ON public.organization_members
  FOR ALL TO authenticated
  USING (public.has_org_permission(organization_id,'members.manage'::public.org_permission))
  WITH CHECK (public.has_org_permission(organization_id,'members.manage'::public.org_permission));

CREATE POLICY "org members can view teams" ON public.teams
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "team managers can write teams" ON public.teams
  FOR ALL TO authenticated
  USING (public.has_org_permission(organization_id,'teams.manage'::public.org_permission))
  WITH CHECK (public.has_org_permission(organization_id,'teams.manage'::public.org_permission));

CREATE POLICY "org members view team members" ON public.team_members
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id AND public.is_org_member(t.organization_id))
  );
CREATE POLICY "team managers manage members" ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id
              AND public.has_org_permission(t.organization_id,'teams.manage'::public.org_permission))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id
              AND public.has_org_permission(t.organization_id,'teams.manage'::public.org_permission))
  );

DROP POLICY IF EXISTS "invite managers can read" ON public.organization_invitations;
DROP POLICY IF EXISTS "invite managers can write" ON public.organization_invitations;
CREATE POLICY "invite managers can read" ON public.organization_invitations
  FOR SELECT TO authenticated USING (public.has_org_permission(organization_id,'invitations.manage'::public.org_permission));
CREATE POLICY "invite managers can write" ON public.organization_invitations
  FOR ALL TO authenticated
  USING (public.has_org_permission(organization_id,'invitations.manage'::public.org_permission))
  WITH CHECK (public.has_org_permission(organization_id,'invitations.manage'::public.org_permission));

-- 8. Triggers
CREATE OR REPLACE FUNCTION public.tg_org_add_owner_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_members(organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner'::public.org_role)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner'::public.org_role;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS org_add_owner_member ON public.organizations;
CREATE TRIGGER org_add_owner_member
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.tg_org_add_owner_member();

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS invites_touch_updated ON public.organization_invitations;
CREATE TRIGGER invites_touch_updated
BEFORE UPDATE ON public.organization_invitations
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
