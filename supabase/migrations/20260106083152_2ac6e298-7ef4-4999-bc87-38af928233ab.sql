-- =============================================
-- JJ GLOBAL CAPITAL CRM MVP - PHASE 1
-- Core Types and Tables (without cross-references)
-- =============================================

-- Create CRM-specific role enum (if not exists)
DO $$ BEGIN
  CREATE TYPE public.crm_role AS ENUM ('owner_admin', 'broker_member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create pipeline status enum
DO $$ BEGIN
  CREATE TYPE public.crm_pipeline_status AS ENUM (
    'new', 'contacted', 'qualified', 'viewing', 
    'negotiation', 'closed_won', 'closed_lost', 'no_answer', 'junk'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create lead owner type enum
DO $$ BEGIN
  CREATE TYPE public.crm_lead_owner_type AS ENUM ('company_assigned', 'broker_owned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create activity type enum
DO $$ BEGIN
  CREATE TYPE public.crm_activity_type AS ENUM (
    'call', 'whatsapp_click', 'email_click', 'note', 
    'status_change', 'followup_created', 'followup_completed', 
    'meeting', 'import', 'assignment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create import source type enum
DO $$ BEGIN
  CREATE TYPE public.crm_import_source AS ENUM ('csv', 'vcf', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1) CRM Users Profile (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_users_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  crm_role crm_role NOT NULL DEFAULT 'broker_member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_users_profile ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is CRM admin
CREATE OR REPLACE FUNCTION public.is_crm_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = _user_id AND crm_role = 'owner_admin' AND is_active = true
  )
$$;

-- Helper function to check if user is active CRM member
CREATE OR REPLACE FUNCTION public.is_active_crm_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- RLS for crm_users_profile
CREATE POLICY "crm_users_profile_select_own" ON public.crm_users_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "crm_users_profile_select_admin" ON public.crm_users_profile
  FOR SELECT USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_users_profile_all_admin" ON public.crm_users_profile
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_users_profile_update_own" ON public.crm_users_profile
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_users_profile_user_id ON public.crm_users_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_users_profile_role ON public.crm_users_profile(crm_role);

-- =============================================
-- 2) CRM Leads
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type crm_lead_owner_type NOT NULL DEFAULT 'company_assigned',
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email_lower TEXT,
  phone_e164 TEXT,
  nationality TEXT,
  preferred_language TEXT DEFAULT 'en',
  current_location_country TEXT,
  current_location_city TEXT,
  gender TEXT,
  age_range TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_crm_leads_phone ON public.crm_leads(phone_e164);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON public.crm_leads(email_lower);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON public.crm_leads(owner_type, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_by ON public.crm_leads(created_by_user_id);

-- =============================================
-- 3) CRM Lead Assignments
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMPTZ
);

ALTER TABLE public.crm_lead_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_crm_lead_assignments_lead ON public.crm_lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_assignments_user ON public.crm_lead_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_assignments_active ON public.crm_lead_assignments(assigned_to_user_id) WHERE unassigned_at IS NULL;

-- =============================================
-- NOW create the helper function that references assignments
-- =============================================
CREATE OR REPLACE FUNCTION public.can_access_crm_lead(_user_id UUID, _lead_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = _user_id AND crm_role = 'owner_admin' AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.crm_leads
    WHERE id = _lead_id 
      AND owner_type = 'broker_owned' 
      AND owner_user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments
    WHERE lead_id = _lead_id 
      AND assigned_to_user_id = _user_id 
      AND unassigned_at IS NULL
  )
$$;

-- =============================================
-- RLS Policies for crm_leads
-- =============================================
CREATE POLICY "crm_leads_admin_all" ON public.crm_leads
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_leads_broker_select" ON public.crm_leads
  FOR SELECT USING (
    is_active_crm_member(auth.uid()) AND (
      (owner_type = 'broker_owned' AND owner_user_id = auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM public.crm_lead_assignments
        WHERE lead_id = crm_leads.id 
          AND assigned_to_user_id = auth.uid() 
          AND unassigned_at IS NULL
      )
    )
  );

CREATE POLICY "crm_leads_broker_insert" ON public.crm_leads
  FOR INSERT WITH CHECK (
    is_active_crm_member(auth.uid()) AND
    owner_type = 'broker_owned' AND
    owner_user_id = auth.uid() AND
    created_by_user_id = auth.uid()
  );

CREATE POLICY "crm_leads_broker_update" ON public.crm_leads
  FOR UPDATE USING (
    is_active_crm_member(auth.uid()) AND (
      (owner_type = 'broker_owned' AND owner_user_id = auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM public.crm_lead_assignments
        WHERE lead_id = crm_leads.id 
          AND assigned_to_user_id = auth.uid() 
          AND unassigned_at IS NULL
      )
    )
  );

-- =============================================
-- RLS for crm_lead_assignments
-- =============================================
CREATE POLICY "crm_lead_assignments_admin" ON public.crm_lead_assignments
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_lead_assignments_broker_select" ON public.crm_lead_assignments
  FOR SELECT USING (
    is_active_crm_member(auth.uid()) AND assigned_to_user_id = auth.uid()
  );

-- =============================================
-- 4) CRM Lead State Per User
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_lead_state_per_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pipeline_status crm_pipeline_status NOT NULL DEFAULT 'new',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_junk BOOLEAN NOT NULL DEFAULT false,
  junk_reason TEXT,
  last_touch_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_lead_state_per_user UNIQUE (lead_id, user_id)
);

ALTER TABLE public.crm_lead_state_per_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_lead_state_admin" ON public.crm_lead_state_per_user
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_lead_state_own" ON public.crm_lead_state_per_user
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_lead_state_user ON public.crm_lead_state_per_user(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_state_status ON public.crm_lead_state_per_user(user_id, pipeline_status);
CREATE INDEX IF NOT EXISTS idx_crm_lead_state_followup ON public.crm_lead_state_per_user(user_id, next_followup_at) WHERE next_followup_at IS NOT NULL;

-- =============================================
-- 5) CRM Activities
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  activity_type crm_activity_type NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_activities_admin" ON public.crm_activities
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_activities_broker_select" ON public.crm_activities
  FOR SELECT USING (
    is_active_crm_member(auth.uid()) AND
    can_access_crm_lead(auth.uid(), lead_id)
  );

CREATE POLICY "crm_activities_broker_insert" ON public.crm_activities
  FOR INSERT WITH CHECK (
    is_active_crm_member(auth.uid()) AND
    user_id = auth.uid() AND
    can_access_crm_lead(auth.uid(), lead_id)
  );

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON public.crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_user ON public.crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created ON public.crm_activities(created_at DESC);

-- =============================================
-- 6) CRM Calls
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_calls_admin" ON public.crm_calls
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_calls_broker" ON public.crm_calls
  FOR ALL USING (
    is_active_crm_member(auth.uid()) AND
    user_id = auth.uid() AND
    can_access_crm_lead(auth.uid(), lead_id)
  )
  WITH CHECK (
    is_active_crm_member(auth.uid()) AND
    user_id = auth.uid() AND
    can_access_crm_lead(auth.uid(), lead_id)
  );

CREATE INDEX IF NOT EXISTS idx_crm_calls_lead ON public.crm_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_calls_user ON public.crm_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_calls_date ON public.crm_calls(started_at DESC);

-- =============================================
-- 7) CRM Tasks
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_tasks_admin" ON public.crm_tasks
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_tasks_own" ON public.crm_tasks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON public.crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON public.crm_tasks(user_id, due_at) WHERE completed_at IS NULL;

-- =============================================
-- 8) CRM Notes
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_notes_admin" ON public.crm_notes
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_notes_broker_select" ON public.crm_notes
  FOR SELECT USING (
    is_active_crm_member(auth.uid()) AND
    can_access_crm_lead(auth.uid(), lead_id)
  );

CREATE POLICY "crm_notes_broker_insert" ON public.crm_notes
  FOR INSERT WITH CHECK (
    is_active_crm_member(auth.uid()) AND
    user_id = auth.uid() AND
    can_access_crm_lead(auth.uid(), lead_id)
  );

CREATE INDEX IF NOT EXISTS idx_crm_notes_lead ON public.crm_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_user ON public.crm_notes(user_id);

-- =============================================
-- 9) CRM Imports
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  source_type crm_import_source NOT NULL DEFAULT 'csv',
  file_name TEXT,
  total_rows INTEGER DEFAULT 0,
  inserted INTEGER DEFAULT 0,
  merged INTEGER DEFAULT 0,
  duplicates INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.crm_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_imports_admin" ON public.crm_imports
  FOR ALL USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_imports_own" ON public.crm_imports
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_imports_user ON public.crm_imports(user_id);

-- =============================================
-- 10) CRM Audit Logs
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_audit_logs_admin_select" ON public.crm_audit_logs
  FOR SELECT USING (is_crm_admin(auth.uid()));

CREATE POLICY "crm_audit_logs_insert" ON public.crm_audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_actor ON public.crm_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_entity ON public.crm_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_created ON public.crm_audit_logs(created_at DESC);

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE OR REPLACE TRIGGER update_crm_users_profile_updated_at
  BEFORE UPDATE ON public.crm_users_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_crm_lead_state_updated_at
  BEFORE UPDATE ON public.crm_lead_state_per_user
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();