-- JBJ Executive AI Assistant & Finance System Tables

-- Executive Assistant Settings & Preferences
CREATE TABLE public.executive_assistant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  assistant_name TEXT DEFAULT 'JBJ Executive Assistant',
  voice_style TEXT DEFAULT 'professional',
  response_speed TEXT DEFAULT 'balanced',
  auto_reply_enabled BOOLEAN DEFAULT false,
  daily_report_time TIME DEFAULT '18:00:00',
  report_delivery_method TEXT DEFAULT 'email',
  encryption_key_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Communication Training Samples (for learning owner's style)
CREATE TABLE public.executive_training_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sample_type TEXT NOT NULL, -- 'email', 'whatsapp', 'instagram', 'general'
  original_message TEXT NOT NULL,
  response_example TEXT NOT NULL,
  tone_tags TEXT[] DEFAULT '{}',
  context_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Communication Logs (encrypted messages handled by assistant)
CREATE TABLE public.executive_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'whatsapp', 'instagram', 'internal'
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  contact_identifier TEXT NOT NULL,
  contact_name TEXT,
  subject TEXT,
  message_content_encrypted TEXT NOT NULL,
  ai_response_encrypted TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'responded', 'flagged', 'archived'
  flagged_reason TEXT,
  confidence_score NUMERIC(3,2),
  handled_by TEXT DEFAULT 'ai', -- 'ai', 'manual'
  phone_line TEXT, -- 'personal', 'company'
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Financial Transactions & Analysis
CREATE TABLE public.executive_financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  category TEXT NOT NULL,
  subcategory TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  merchant_name TEXT,
  payment_method TEXT,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  ai_recommendation TEXT,
  source_file TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Budget Categories & Limits
CREATE TABLE public.executive_budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  monthly_limit NUMERIC(12,2),
  current_spent NUMERIC(12,2) DEFAULT 0,
  priority_level INTEGER DEFAULT 5,
  color_code TEXT DEFAULT '#3b82f6',
  icon_name TEXT DEFAULT 'DollarSign',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_name)
);

-- Daily Executive Reports
CREATE TABLE public.executive_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_pending INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  communications_handled INTEGER DEFAULT 0,
  communications_flagged INTEGER DEFAULT 0,
  financial_summary JSONB DEFAULT '{}',
  marketing_summary JSONB DEFAULT '{}',
  broker_summary JSONB DEFAULT '{}',
  department_breakdown JSONB DEFAULT '{}',
  recommendations TEXT[],
  report_pdf_url TEXT,
  report_excel_url TEXT,
  delivered_via TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, report_date)
);

-- Audit & Compliance Logs
CREATE TABLE public.executive_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  audit_type TEXT NOT NULL, -- 'communication', 'financial', 'system', 'broker'
  entity_id UUID,
  entity_type TEXT,
  action TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  compliance_status TEXT DEFAULT 'compliant',
  issues_found TEXT[],
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  audited_at TIMESTAMPTZ DEFAULT now()
);

-- AI Department Coordination Tasks
CREATE TABLE public.executive_department_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_id UUID, -- Groups related tasks
  department TEXT NOT NULL, -- 'marketing', 'design', 'finance', 'admin', 'audit'
  task_description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_ai TEXT,
  input_data JSONB,
  output_data JSONB,
  parent_task_id UUID REFERENCES public.executive_department_tasks(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.executive_assistant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_department_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Owner-only access (maximum privacy)
CREATE POLICY "Owner only access to settings"
ON public.executive_assistant_settings
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner only access to training samples"
ON public.executive_training_samples
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner only access to communications"
ON public.executive_communications
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner only access to financial transactions"
ON public.executive_financial_transactions
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner only access to budget categories"
ON public.executive_budget_categories
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner only access to daily reports"
ON public.executive_daily_reports
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner only access to audit logs"
ON public.executive_audit_logs
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner only access to department tasks"
ON public.executive_department_tasks
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_executive_settings_updated_at
  BEFORE UPDATE ON public.executive_assistant_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_executive_budget_updated_at
  BEFORE UPDATE ON public.executive_budget_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();