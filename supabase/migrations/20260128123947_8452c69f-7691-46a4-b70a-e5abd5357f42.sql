-- =====================================================
-- HR LEAVE MANAGEMENT SYSTEM (FIXED ROLES)
-- =====================================================

-- Leave types enum
CREATE TYPE public.leave_type AS ENUM (
  'annual', 
  'sick', 
  'unpaid', 
  'maternity', 
  'paternity', 
  'emergency', 
  'bereavement',
  'public_holiday'
);

-- Leave request status
CREATE TYPE public.leave_status AS ENUM (
  'pending',
  'manager_approved',
  'hr_approved', 
  'owner_approved',
  'rejected',
  'cancelled'
);

-- Warning severity
CREATE TYPE public.warning_severity AS ENUM (
  'verbal',
  'written',
  'final',
  'termination'
);

-- Approval request types
CREATE TYPE public.approval_type AS ENUM (
  'leave_request',
  'expense_claim',
  'document_request',
  'salary_advance',
  'equipment_request',
  'training_request'
);

-- =====================================================
-- LEAVE POLICY TABLE
-- =====================================================
CREATE TABLE public.hr_leave_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  leave_type leave_type NOT NULL,
  days_per_year INTEGER NOT NULL DEFAULT 0,
  accrual_rate_per_month NUMERIC(4,2) DEFAULT 0,
  carry_forward_days INTEGER DEFAULT 0,
  min_service_days INTEGER DEFAULT 0,
  requires_document BOOLEAN DEFAULT false,
  max_consecutive_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- EMPLOYEE LEAVE BALANCE
-- =====================================================
CREATE TABLE public.hr_leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  entitled_days NUMERIC(5,2) DEFAULT 0,
  accrued_days NUMERIC(5,2) DEFAULT 0,
  taken_days NUMERIC(5,2) DEFAULT 0,
  pending_days NUMERIC(5,2) DEFAULT 0,
  carried_forward NUMERIC(5,2) DEFAULT 0,
  remaining_days NUMERIC(5,2) GENERATED ALWAYS AS (entitled_days + accrued_days + carried_forward - taken_days - pending_days) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, leave_type, year)
);

-- =====================================================
-- LEAVE REQUESTS TABLE
-- =====================================================
CREATE TABLE public.hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  department TEXT,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(5,2) NOT NULL,
  reason TEXT,
  supporting_document_url TEXT,
  status leave_status DEFAULT 'pending',
  
  -- Multi-stage approval tracking
  manager_id UUID,
  manager_name TEXT,
  manager_decision leave_status,
  manager_decision_at TIMESTAMPTZ,
  manager_notes TEXT,
  
  hr_id UUID,
  hr_name TEXT,
  hr_decision leave_status,
  hr_decision_at TIMESTAMPTZ,
  hr_notes TEXT,
  
  owner_id UUID,
  owner_name TEXT,
  owner_decision leave_status,
  owner_decision_at TIMESTAMPTZ,
  owner_notes TEXT,
  
  current_stage TEXT DEFAULT 'manager',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- EMPLOYEE WARNINGS TABLE
-- =====================================================
CREATE TABLE public.hr_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  department TEXT,
  
  warning_type warning_severity NOT NULL,
  warning_number INTEGER DEFAULT 1,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE,
  
  -- Issued by
  issued_by_id UUID,
  issued_by_name TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  
  -- Employee acknowledgment
  requires_signature BOOLEAN DEFAULT true,
  employee_signature_url TEXT,
  employee_signed_at TIMESTAMPTZ,
  employee_response TEXT,
  
  -- Document
  warning_document_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- GENERAL APPROVAL WORKFLOW TABLE
-- =====================================================
CREATE TABLE public.hr_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type approval_type NOT NULL,
  reference_id UUID,
  reference_table TEXT,
  
  requester_id UUID NOT NULL,
  requester_name TEXT NOT NULL,
  department TEXT,
  
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'AED',
  
  -- Multi-stage approval
  stages JSONB DEFAULT '[]',
  current_stage INTEGER DEFAULT 1,
  total_stages INTEGER DEFAULT 3,
  
  -- Stage 1: Manager
  stage1_approver_id UUID,
  stage1_approver_name TEXT,
  stage1_status TEXT DEFAULT 'pending',
  stage1_decision_at TIMESTAMPTZ,
  stage1_notes TEXT,
  
  -- Stage 2: HR
  stage2_approver_id UUID,
  stage2_approver_name TEXT,
  stage2_status TEXT DEFAULT 'pending',
  stage2_decision_at TIMESTAMPTZ,
  stage2_notes TEXT,
  
  -- Stage 3: Owner
  stage3_approver_id UUID,
  stage3_approver_name TEXT,
  stage3_status TEXT DEFAULT 'pending',
  stage3_decision_at TIMESTAMPTZ,
  stage3_notes TEXT,
  
  overall_status TEXT DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- EMPLOYEE ONBOARDING CHECKLIST
-- =====================================================
CREATE TABLE public.hr_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_category TEXT DEFAULT 'general',
  required_documents TEXT[],
  is_mandatory BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.hr_employee_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  task_id UUID REFERENCES hr_onboarding_tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  document_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- HR NOTIFICATIONS
-- =====================================================
CREATE TABLE public.hr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.hr_leave_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Using correct crm_role values: owner_admin, founder, admin, broker_member, sales_director)
-- =====================================================

-- Leave Policy: Admins can manage, employees can view
CREATE POLICY "hr_leave_policy_select" ON public.hr_leave_policy
FOR SELECT TO authenticated USING (true);

CREATE POLICY "hr_leave_policy_admin" ON public.hr_leave_policy
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'founder', 'admin')
  )
);

-- Leave Balance: Users see own, HR/Admin see all
CREATE POLICY "hr_leave_balance_own" ON public.hr_leave_balance
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "hr_leave_balance_admin" ON public.hr_leave_balance
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
  )
);

-- Leave Requests: Users see own, managers see team, HR/Admin see all
CREATE POLICY "hr_leave_requests_own" ON public.hr_leave_requests
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "hr_leave_requests_insert" ON public.hr_leave_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "hr_leave_requests_admin" ON public.hr_leave_requests
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
  )
);

-- Warnings: Users see own, HR/Admin manage
CREATE POLICY "hr_warnings_own" ON public.hr_warnings
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "hr_warnings_admin" ON public.hr_warnings
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'founder', 'admin')
  )
);

-- Approval Requests: Users see own, approvers see relevant
CREATE POLICY "hr_approval_own" ON public.hr_approval_requests
FOR SELECT TO authenticated
USING (requester_id = auth.uid());

CREATE POLICY "hr_approval_insert" ON public.hr_approval_requests
FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "hr_approval_admin" ON public.hr_approval_requests
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
  )
);

-- Onboarding Tasks: Public read
CREATE POLICY "hr_onboarding_tasks_select" ON public.hr_onboarding_tasks
FOR SELECT TO authenticated USING (true);

CREATE POLICY "hr_onboarding_tasks_admin" ON public.hr_onboarding_tasks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'founder', 'admin')
  )
);

-- Employee Onboarding: Users see own, HR manage
CREATE POLICY "hr_employee_onboarding_own" ON public.hr_employee_onboarding
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "hr_employee_onboarding_admin" ON public.hr_employee_onboarding
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'founder', 'admin')
  )
);

-- Notifications: Users see own only
CREATE POLICY "hr_notifications_own" ON public.hr_notifications
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- INSERT DEFAULT LEAVE POLICIES (UAE Standard)
-- =====================================================
INSERT INTO public.hr_leave_policy (policy_name, leave_type, days_per_year, accrual_rate_per_month, carry_forward_days, min_service_days, requires_document) VALUES
('Annual Leave', 'annual', 30, 2.5, 5, 180, false),
('Sick Leave', 'sick', 15, 0, 0, 0, true),
('Unpaid Leave', 'unpaid', 30, 0, 0, 0, false),
('Maternity Leave', 'maternity', 60, 0, 0, 365, true),
('Paternity Leave', 'paternity', 5, 0, 0, 365, true),
('Emergency Leave', 'emergency', 5, 0, 0, 0, false),
('Bereavement Leave', 'bereavement', 5, 0, 0, 0, true);

-- =====================================================
-- INSERT DEFAULT ONBOARDING TASKS
-- =====================================================
INSERT INTO public.hr_onboarding_tasks (task_name, task_description, task_category, is_mandatory, order_index) VALUES
('Submit ID Documents', 'Upload passport, Emirates ID, and visa copies', 'documentation', true, 1),
('Sign Employment Contract', 'Review and sign the employment contract', 'contracts', true, 2),
('Complete Bank Details', 'Provide bank account information for salary', 'finance', true, 3),
('Emergency Contact', 'Provide emergency contact information', 'personal', true, 4),
('IT Setup', 'Receive company email and system access', 'it', true, 5),
('Company Orientation', 'Complete company orientation training', 'training', true, 6),
('Department Introduction', 'Meet team members and understand department workflow', 'onboarding', true, 7),
('Health Insurance Registration', 'Complete health insurance enrollment', 'benefits', true, 8);

-- =====================================================
-- FUNCTIONS FOR LEAVE CALCULATIONS
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_leave_eligibility(
  p_user_id UUID,
  p_leave_type leave_type
)
RETURNS TABLE (
  entitled_days NUMERIC,
  accrued_days NUMERIC,
  taken_days NUMERIC,
  remaining_days NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
  v_months_worked INTEGER;
  v_policy RECORD;
BEGIN
  -- Get employee start date
  SELECT start_date INTO v_start_date
  FROM hr_employees
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF v_start_date IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate months worked
  v_months_worked := GREATEST(0, EXTRACT(MONTH FROM age(CURRENT_DATE, v_start_date)) + 
                              EXTRACT(YEAR FROM age(CURRENT_DATE, v_start_date)) * 12);
  
  -- Get leave policy
  SELECT * INTO v_policy
  FROM hr_leave_policy
  WHERE leave_type = p_leave_type AND is_active = true
  LIMIT 1;
  
  IF v_policy IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    v_policy.days_per_year::NUMERIC as entitled_days,
    LEAST(v_policy.days_per_year, v_months_worked * v_policy.accrual_rate_per_month)::NUMERIC as accrued_days,
    COALESCE((SELECT SUM(total_days) FROM hr_leave_requests 
              WHERE user_id = p_user_id AND leave_type = p_leave_type 
              AND status IN ('owner_approved') 
              AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0)::NUMERIC as taken_days,
    LEAST(v_policy.days_per_year, v_months_worked * v_policy.accrual_rate_per_month)::NUMERIC -
    COALESCE((SELECT SUM(total_days) FROM hr_leave_requests 
              WHERE user_id = p_user_id AND leave_type = p_leave_type 
              AND status IN ('owner_approved') 
              AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0)::NUMERIC as remaining_days;
END;
$$;

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.hr_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hr_leave_requests_updated
BEFORE UPDATE ON hr_leave_requests
FOR EACH ROW EXECUTE FUNCTION hr_update_timestamp();

CREATE TRIGGER hr_warnings_updated
BEFORE UPDATE ON hr_warnings
FOR EACH ROW EXECUTE FUNCTION hr_update_timestamp();

CREATE TRIGGER hr_approval_requests_updated
BEFORE UPDATE ON hr_approval_requests
FOR EACH ROW EXECUTE FUNCTION hr_update_timestamp();