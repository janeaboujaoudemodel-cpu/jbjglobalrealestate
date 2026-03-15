
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE public.registration_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_stage_status') THEN
    CREATE TYPE public.approval_stage_status AS ENUM ('pending', 'approved', 'rejected', 'skipped');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_approval_status') THEN
    CREATE TYPE public.event_approval_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.developer_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  trade_license_number TEXT,
  trade_license_url TEXT,
  company_logo_url TEXT,
  company_website TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  emirate TEXT,
  rera_number TEXT,
  year_established INT,
  key_contacts JSONB DEFAULT '[]'::jsonb,
  status registration_status NOT NULL DEFAULT 'draft',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own registrations" ON public.developer_registrations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can view all registrations" ON public.developer_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owner can update registrations" ON public.developer_registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  stage INT NOT NULL DEFAULT 1,
  stage_name TEXT NOT NULL,
  status approval_stage_status NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage approvals" ON public.approval_workflows FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Users can view own entity approvals" ON public.approval_workflows FOR SELECT TO authenticated USING (entity_id IN (SELECT id FROM public.developer_registrations WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.launch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_user_id UUID NOT NULL,
  developer_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_end_date TIMESTAMPTZ,
  venue TEXT,
  venue_address TEXT,
  max_attendees INT DEFAULT 100,
  cover_image_url TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  approval_status event_approval_status NOT NULL DEFAULT 'draft',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.launch_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own events" ON public.launch_events FOR ALL TO authenticated USING (developer_user_id = auth.uid()) WITH CHECK (developer_user_id = auth.uid());
CREATE POLICY "Owner can manage all events" ON public.launch_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Approved events visible to all" ON public.launch_events FOR SELECT TO authenticated USING (approval_status = 'approved');

-- Add missing columns to existing event_invitations
ALTER TABLE public.event_invitations ADD COLUMN IF NOT EXISTS rsvp_status TEXT DEFAULT 'pending';
ALTER TABLE public.event_invitations ADD COLUMN IF NOT EXISTS rsvp_at TIMESTAMPTZ;
ALTER TABLE public.event_invitations ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT false;
ALTER TABLE public.event_invitations ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE public.event_invitations ADD COLUMN IF NOT EXISTS rating INT;

CREATE TABLE IF NOT EXISTS public.developer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  gender TEXT,
  languages TEXT[] DEFAULT '{}',
  years_in_real_estate INT,
  date_joined_developer DATE,
  developer_company TEXT,
  projects TEXT[] DEFAULT '{}',
  rating NUMERIC(3,1),
  feedback TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own contacts" ON public.developer_contacts FOR ALL TO authenticated USING (developer_user_id = auth.uid()) WITH CHECK (developer_user_id = auth.uid());
CREATE POLICY "Owner can view all contacts" ON public.developer_contacts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
