-- =============================================
-- CRM COMPREHENSIVE SCHEMA UPDATE
-- Import/Flagging/VIP/AI Employee Support
-- =============================================

-- 1. Create crm_lead_sources table (normalized source entity)
CREATE TABLE IF NOT EXISTS public.crm_lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_group TEXT NOT NULL DEFAULT 'imported',
  source_file_name TEXT,
  total_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  flagged_rows INTEGER DEFAULT 0,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on crm_lead_sources
ALTER TABLE public.crm_lead_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_lead_sources
CREATE POLICY "CRM users can view lead sources"
ON public.crm_lead_sources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "CRM users can create lead sources"
ON public.crm_lead_sources FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 2. Add new columns to crm_leads
ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.crm_lead_sources(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS import_batch_id UUID,
ADD COLUMN IF NOT EXISTS source_row_index INTEGER,
ADD COLUMN IF NOT EXISTS raw_import JSONB,
ADD COLUMN IF NOT EXISTS phone_raw TEXT,
ADD COLUMN IF NOT EXISTS phone_normalized TEXT,
ADD COLUMN IF NOT EXISTS email_normalized TEXT,
ADD COLUMN IF NOT EXISTS vip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vip_tagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vip_tagged_by UUID,
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reasons TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID,
ADD COLUMN IF NOT EXISTS assigned_ai_employee_id UUID,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_source_id ON public.crm_leads(source_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_import_batch_id ON public.crm_leads(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_flagged ON public.crm_leads(flagged) WHERE flagged = true;
CREATE INDEX IF NOT EXISTS idx_crm_leads_vip ON public.crm_leads(vip) WHERE vip = true;
CREATE INDEX IF NOT EXISTS idx_crm_leads_phone_normalized ON public.crm_leads(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email_normalized ON public.crm_leads(email_normalized);

-- 3. Create crm_ai_employees table
CREATE TABLE IF NOT EXISTS public.crm_ai_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_ai_employees ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_ai_employees
CREATE POLICY "CRM users can view AI employees"
ON public.crm_ai_employees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "CRM admins can manage AI employees"
ON public.crm_ai_employees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true AND crm_role IN ('owner_admin', 'founder')
  )
);

-- Add FK constraint for assigned_ai_employee_id
ALTER TABLE public.crm_leads 
DROP CONSTRAINT IF EXISTS crm_leads_assigned_ai_employee_id_fkey;
ALTER TABLE public.crm_leads 
ADD CONSTRAINT crm_leads_assigned_ai_employee_id_fkey 
FOREIGN KEY (assigned_ai_employee_id) REFERENCES public.crm_ai_employees(id) ON DELETE SET NULL;

-- 4. Create crm_ai_drafts table (reviewable AI outputs)
CREATE TABLE IF NOT EXISTS public.crm_ai_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  ai_employee_id UUID REFERENCES public.crm_ai_employees(id) ON DELETE SET NULL,
  draft_type TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_ai_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_ai_drafts
CREATE POLICY "CRM users can view drafts for their leads"
ON public.crm_ai_drafts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "CRM users can manage drafts"
ON public.crm_ai_drafts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 5. Create crm_lead_shortlists table (property selections per lead)
CREATE TABLE IF NOT EXISTS public.crm_lead_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_data JSONB,
  added_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_lead_shortlists ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "CRM users can view shortlists"
ON public.crm_lead_shortlists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "CRM users can manage shortlists"
ON public.crm_lead_shortlists FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_crm_lead_shortlists_lead_id ON public.crm_lead_shortlists(lead_id);

-- 6. Create crm_lead_reports table (saved comparisons/mortgage/PDFs)
CREATE TABLE IF NOT EXISTS public.crm_lead_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  title TEXT,
  report_data JSONB,
  pdf_url TEXT,
  include_broker_info BOOLEAN DEFAULT false,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_lead_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "CRM users can view reports"
ON public.crm_lead_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "CRM users can manage reports"
ON public.crm_lead_reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_crm_lead_reports_lead_id ON public.crm_lead_reports(lead_id);

-- 7. Create VIP leads view (for export and filtering)
CREATE OR REPLACE VIEW public.crm_vip_leads AS
SELECT * FROM public.crm_leads WHERE vip = true;

-- 8. Insert default AI employees
INSERT INTO public.crm_ai_employees (name, role, description, permissions, is_active)
VALUES 
  ('Welcome Assistant', 'welcome_assistant', 'Sends initial welcome messages to new leads', ARRAY['send_whatsapp_template', 'create_draft', 'update_notes'], true),
  ('Follow-up Bot', 'follow_up_bot', 'Creates follow-up sequences and reminders', ARRAY['create_draft', 'update_notes', 'schedule_task'], true),
  ('Marketing Assistant', 'marketing_assistant', 'Prepares marketing content and campaigns', ARRAY['create_draft', 'create_campaign'], true),
  ('VIP Concierge', 'vip_concierge', 'Handles VIP client communications', ARRAY['send_whatsapp_template', 'create_draft', 'update_notes', 'schedule_task'], true)
ON CONFLICT DO NOTHING;