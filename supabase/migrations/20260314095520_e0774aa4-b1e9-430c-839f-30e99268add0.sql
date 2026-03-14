
-- 1. crm_field_permissions table
CREATE TABLE public.crm_field_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_role text NOT NULL,
  field_name text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  show_masked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(crm_role, field_name)
);

ALTER TABLE public.crm_field_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage field permissions"
ON public.crm_field_permissions FOR ALL
TO authenticated
USING (auth.email() = 'janeaboujaoudenails@gmail.com')
WITH CHECK (auth.email() = 'janeaboujaoudenails@gmail.com');

CREATE POLICY "CRM members can read field permissions"
ON public.crm_field_permissions FOR SELECT
TO authenticated
USING (true);

-- 2. crm_lead_shares table
CREATE TABLE public.crm_lead_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_with uuid NOT NULL,
  permission_level text NOT NULL DEFAULT 'view',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_lead_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages all shares"
ON public.crm_lead_shares FOR ALL
TO authenticated
USING (auth.email() = 'janeaboujaoudenails@gmail.com')
WITH CHECK (auth.email() = 'janeaboujaoudenails@gmail.com');

CREATE POLICY "Users can view their own shares"
ON public.crm_lead_shares FOR SELECT
TO authenticated
USING (shared_with = auth.uid() AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "CRM admins can create shares"
ON public.crm_lead_shares FOR INSERT
TO authenticated
WITH CHECK (shared_by = auth.uid());

-- 3. crm_security_events table
CREATE TABLE public.crm_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read all security events"
ON public.crm_security_events FOR SELECT
TO authenticated
USING (auth.email() = 'janeaboujaoudenails@gmail.com');

CREATE POLICY "Authenticated users can insert security events"
ON public.crm_security_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Security definer function for field permissions
CREATE OR REPLACE FUNCTION public.get_crm_field_permissions(p_role text)
RETURNS TABLE(field_name text, can_view boolean, can_edit boolean, show_masked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fp.field_name, fp.can_view, fp.can_edit, fp.show_masked
  FROM crm_field_permissions fp
  WHERE fp.crm_role = p_role;
$$;

-- 5. Seed permission matrix
INSERT INTO public.crm_field_permissions (crm_role, field_name, can_view, can_edit, show_masked) VALUES
-- Owner: full access
('owner_admin', 'phone_e164', true, true, false),
('owner_admin', 'email_lower', true, true, false),
('owner_admin', 'nationality', true, true, false),
('owner_admin', 'budget', true, true, false),
('owner_admin', 'notes', true, true, false),
('owner_admin', 'source', true, true, false),
('owner_admin', 'pipeline_stage', true, true, false),
('owner_admin', 'ai_score', true, false, false),
('owner_admin', 'assigned_broker', true, true, false),
('owner_admin', 'internal_comments', true, true, false),
('owner_admin', 'ai_qualification', true, false, false),
-- Founder: full access
('founder', 'phone_e164', true, true, false),
('founder', 'email_lower', true, true, false),
('founder', 'nationality', true, true, false),
('founder', 'budget', true, true, false),
('founder', 'notes', true, true, false),
('founder', 'source', true, true, false),
('founder', 'pipeline_stage', true, true, false),
('founder', 'ai_score', true, false, false),
('founder', 'assigned_broker', true, true, false),
('founder', 'internal_comments', true, true, false),
('founder', 'ai_qualification', true, false, false),
-- Sales Director: view most, edit some
('sales_director', 'phone_e164', true, false, false),
('sales_director', 'email_lower', true, false, false),
('sales_director', 'nationality', true, false, false),
('sales_director', 'budget', true, false, false),
('sales_director', 'notes', true, true, false),
('sales_director', 'source', true, false, false),
('sales_director', 'pipeline_stage', true, true, false),
('sales_director', 'ai_score', true, false, false),
('sales_director', 'assigned_broker', true, true, false),
('sales_director', 'internal_comments', true, false, false),
('sales_director', 'ai_qualification', true, false, false),
-- Broker: limited, masked sensitive
('broker_member', 'phone_e164', false, false, true),
('broker_member', 'email_lower', false, false, true),
('broker_member', 'nationality', true, false, false),
('broker_member', 'budget', false, false, false),
('broker_member', 'notes', true, true, false),
('broker_member', 'source', true, false, false),
('broker_member', 'pipeline_stage', true, false, false),
('broker_member', 'ai_score', false, false, false),
('broker_member', 'assigned_broker', true, false, false),
('broker_member', 'internal_comments', false, false, false),
('broker_member', 'ai_qualification', false, false, false),
-- Admin: similar to sales director
('admin', 'phone_e164', true, false, false),
('admin', 'email_lower', true, false, false),
('admin', 'nationality', true, false, false),
('admin', 'budget', true, false, false),
('admin', 'notes', true, true, false),
('admin', 'source', true, false, false),
('admin', 'pipeline_stage', true, true, false),
('admin', 'ai_score', true, false, false),
('admin', 'assigned_broker', true, false, false),
('admin', 'internal_comments', true, false, false),
('admin', 'ai_qualification', true, false, false);
