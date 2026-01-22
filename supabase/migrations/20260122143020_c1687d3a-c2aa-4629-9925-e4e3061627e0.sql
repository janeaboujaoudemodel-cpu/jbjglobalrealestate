-- ============================================
-- UNIFIED HR + IT EMPLOYEE MANAGEMENT SYSTEM
-- Full Employee Journey Tracking & Audit
-- ============================================

-- 1. Employee Journey Tracking Table
CREATE TABLE IF NOT EXISTS public.employee_journey_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES crm_users_profile(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'hired', 'promoted', 'department_change', 'role_change', 'terminated', 'onboarding_step', 'probation_passed', 'warning_issued'
  event_category TEXT NOT NULL DEFAULT 'general', -- 'hr', 'it', 'performance', 'access', 'training'
  previous_value JSONB DEFAULT '{}',
  new_value JSONB DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Employee Activity Audit (Micromanagement)
CREATE TABLE IF NOT EXISTS public.employee_activity_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  login_at TIMESTAMPTZ,
  logout_at TIMESTAMPTZ,
  session_duration_minutes INTEGER,
  pages_visited TEXT[] DEFAULT '{}',
  actions_performed JSONB DEFAULT '[]',
  clicks_count INTEGER DEFAULT 0,
  leads_viewed INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  documents_accessed INTEGER DEFAULT 0,
  idle_time_minutes INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0, -- 0-100 score
  ip_address INET,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. IT Provisioning Records
CREATE TABLE IF NOT EXISTS public.it_provisioning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES new_joiner_applications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  employee_email TEXT NOT NULL,
  temporary_password TEXT, -- Will be hashed or encrypted
  email_signature_html TEXT,
  email_signature_plain TEXT,
  crm_access_granted BOOLEAN DEFAULT false,
  tools_access JSONB DEFAULT '[]', -- Array of tool names
  permissions_granted JSONB DEFAULT '[]',
  workstation_assigned TEXT,
  software_licenses JSONB DEFAULT '[]',
  provisioned_by UUID REFERENCES auth.users(id),
  provisioned_at TIMESTAMPTZ DEFAULT now(),
  welcome_email_sent BOOLEAN DEFAULT false,
  welcome_email_sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Employee Performance Metrics (Monthly Summary)
CREATE TABLE IF NOT EXISTS public.employee_performance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL, -- First day of the month
  total_logins INTEGER DEFAULT 0,
  avg_session_duration_minutes DECIMAL(10,2) DEFAULT 0,
  total_active_hours DECIMAL(10,2) DEFAULT 0,
  leads_handled INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  avg_call_duration_seconds INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  response_time_avg_minutes DECIMAL(10,2),
  deals_closed INTEGER DEFAULT 0,
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  commission_earned DECIMAL(15,2) DEFAULT 0,
  activity_score_avg INTEGER DEFAULT 0,
  warnings_received INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- 5. Add HR approval fields to new_joiner_applications
ALTER TABLE public.new_joiner_applications 
ADD COLUMN IF NOT EXISTS hr_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS hr_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hr_notes TEXT,
ADD COLUMN IF NOT EXISTS it_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS it_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS probation_end_date DATE,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'full_time'; -- 'full_time', 'part_time', 'contract', 'intern'

-- Enable RLS
ALTER TABLE public.employee_journey_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activity_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_provisioning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_performance_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_journey_logs
CREATE POLICY "Admins can manage journey logs"
ON public.employee_journey_logs
FOR ALL
USING (
  is_crm_admin(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Employees can view own journey"
ON public.employee_journey_logs
FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for employee_activity_audit
CREATE POLICY "Admins can view all activity"
ON public.employee_activity_audit
FOR ALL
USING (
  is_crm_admin(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Employees can view own activity"
ON public.employee_activity_audit
FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for it_provisioning_records
CREATE POLICY "IT and admins can manage provisioning"
ON public.it_provisioning_records
FOR ALL
USING (
  is_crm_admin(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- RLS Policies for employee_performance_summary
CREATE POLICY "Admins can manage performance"
ON public.employee_performance_summary
FOR ALL
USING (
  is_crm_admin(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Employees can view own performance"
ON public.employee_performance_summary
FOR SELECT
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journey_logs_user ON public.employee_journey_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_logs_event ON public.employee_journey_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_audit_user ON public.employee_activity_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_audit_date ON public.employee_activity_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_user_month ON public.employee_performance_summary(user_id, month);
CREATE INDEX IF NOT EXISTS idx_provisioning_app ON public.it_provisioning_records(application_id);

-- Trigger for updated_at
CREATE TRIGGER update_it_provisioning_updated_at
  BEFORE UPDATE ON public.it_provisioning_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_summary_updated_at
  BEFORE UPDATE ON public.employee_performance_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();