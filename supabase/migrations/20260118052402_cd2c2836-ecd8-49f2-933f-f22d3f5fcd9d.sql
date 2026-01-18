-- Employee Salary & Commission Tracking System
-- For HR, Finance, and Leadership roles

-- Create employee salary records table
CREATE TABLE public.employee_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  salary_type TEXT NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'annual', 'hourly')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_iban TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Create employee commission records table
CREATE TABLE public.employee_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  deal_id TEXT,
  deal_reference TEXT,
  property_type TEXT,
  property_location TEXT,
  deal_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payment_date DATE,
  deal_closed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ
);

-- Create employee payment history table
CREATE TABLE public.employee_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('salary', 'commission', 'bonus', 'reimbursement', 'advance', 'deduction')),
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  payment_method TEXT DEFAULT 'bank_transfer',
  reference_number TEXT,
  payment_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  related_commission_id UUID REFERENCES public.employee_commissions(id),
  related_salary_id UUID REFERENCES public.employee_salaries(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_by UUID
);

-- Create employee earnings summary view (for quick reports)
CREATE TABLE public.employee_earnings_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_salary NUMERIC(12, 2) DEFAULT 0,
  total_commission NUMERIC(12, 2) DEFAULT 0,
  total_bonus NUMERIC(12, 2) DEFAULT 0,
  total_deductions NUMERIC(12, 2) DEFAULT 0,
  net_earnings NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, year, month)
);

-- Enable RLS
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_earnings_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_salaries (HR admins, Finance, Leadership, or own records)
CREATE POLICY "HR and Finance can view all salaries" ON public.employee_salaries
  FOR SELECT USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_crm_admin(auth.uid())
  );

CREATE POLICY "Employees can view their own salary" ON public.employee_salaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR and Finance can manage salaries" ON public.employee_salaries
  FOR ALL USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

-- RLS Policies for employee_commissions
CREATE POLICY "HR and Finance can view all commissions" ON public.employee_commissions
  FOR SELECT USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_crm_admin(auth.uid())
  );

CREATE POLICY "Employees can view their own commissions" ON public.employee_commissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR and Finance can manage commissions" ON public.employee_commissions
  FOR ALL USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

-- RLS Policies for employee_payment_history
CREATE POLICY "HR and Finance can view all payments" ON public.employee_payment_history
  FOR SELECT USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_crm_admin(auth.uid())
  );

CREATE POLICY "Employees can view their own payments" ON public.employee_payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR and Finance can manage payments" ON public.employee_payment_history
  FOR ALL USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

-- RLS Policies for employee_earnings_summary
CREATE POLICY "HR and Finance can view all earnings summaries" ON public.employee_earnings_summary
  FOR SELECT USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role) OR
    public.is_crm_admin(auth.uid())
  );

CREATE POLICY "Employees can view their own earnings summary" ON public.employee_earnings_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR and Finance can manage earnings summaries" ON public.employee_earnings_summary
  FOR ALL USING (
    public.is_hr_manager(auth.uid()) OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

-- Add indexes for performance
CREATE INDEX idx_employee_salaries_user ON public.employee_salaries(user_id);
CREATE INDEX idx_employee_commissions_user ON public.employee_commissions(user_id);
CREATE INDEX idx_employee_commissions_status ON public.employee_commissions(status);
CREATE INDEX idx_employee_payment_history_user ON public.employee_payment_history(user_id);
CREATE INDEX idx_employee_earnings_summary_user_period ON public.employee_earnings_summary(user_id, year, month);

-- Add triggers for updated_at
CREATE TRIGGER update_employee_salaries_updated_at
  BEFORE UPDATE ON public.employee_salaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_employee_commissions_updated_at
  BEFORE UPDATE ON public.employee_commissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_employee_earnings_summary_updated_at
  BEFORE UPDATE ON public.employee_earnings_summary
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();