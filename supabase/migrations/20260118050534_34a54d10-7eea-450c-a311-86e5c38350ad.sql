-- =============================================
-- HR JOB OFFERS MANAGEMENT SYSTEM
-- =============================================

-- Job offer templates by department
CREATE TABLE public.hr_job_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  position_title TEXT NOT NULL,
  document_url TEXT,
  document_name TEXT,
  description TEXT,
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  commission_structure TEXT,
  benefits TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hr_job_offers ENABLE ROW LEVEL SECURITY;

-- Only HR managers and admins can manage job offers
CREATE POLICY "HR admins can manage job offers"
  ON public.hr_job_offers FOR ALL
  USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'owner'::app_role));

-- =============================================
-- EMPLOYEE PERFORMANCE TRACKING
-- =============================================

-- Employee login/activity sessions
CREATE TABLE public.employee_activity_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT, -- AI employee ID from team-members.ts
  session_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  pages_visited TEXT[],
  actions_performed JSONB DEFAULT '[]',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employee_activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.employee_activity_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "HR managers can view all sessions"
  ON public.employee_activity_sessions FOR SELECT
  USING (public.is_hr_manager(auth.uid()));

CREATE POLICY "Users can insert their own sessions"
  ON public.employee_activity_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.employee_activity_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Employee daily performance metrics
CREATE TABLE public.employee_daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_hours_worked NUMERIC(5,2) DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  chats_handled INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  meetings_attended INTEGER DEFAULT 0,
  documents_processed INTEGER DEFAULT 0,
  performance_score INTEGER, -- 0-100
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, metric_date),
  UNIQUE(employee_id, metric_date)
);

ALTER TABLE public.employee_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON public.employee_daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "HR managers can view all metrics"
  ON public.employee_daily_metrics FOR SELECT
  USING (public.is_hr_manager(auth.uid()));

CREATE POLICY "HR managers can manage metrics"
  ON public.employee_daily_metrics FOR ALL
  USING (public.is_hr_manager(auth.uid()));

-- =============================================
-- SALARY BENCHMARKING
-- =============================================

CREATE TABLE public.hr_salary_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  position_title TEXT NOT NULL,
  experience_level TEXT, -- junior, mid, senior, lead, director
  market_salary_min NUMERIC,
  market_salary_max NUMERIC,
  market_salary_avg NUMERIC,
  commission_typical TEXT,
  benefits_standard TEXT[],
  data_source TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.hr_salary_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR managers can manage benchmarks"
  ON public.hr_salary_benchmarks FOR ALL
  USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'owner'::app_role));

-- =============================================
-- JOB APPLICANT TRACKING
-- =============================================

CREATE TABLE public.hr_job_applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_offer_id UUID REFERENCES public.hr_job_offers(id) ON DELETE SET NULL,
  department TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  current_salary NUMERIC,
  expected_salary NUMERIC,
  experience_years INTEGER,
  status TEXT DEFAULT 'new', -- new, reviewing, interview_scheduled, offer_sent, hired, rejected
  interview_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  assigned_hr_user_id UUID REFERENCES auth.users(id),
  job_offer_sent_at TIMESTAMP WITH TIME ZONE,
  job_offer_signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.hr_job_applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR managers can manage applicants"
  ON public.hr_job_applicants FOR ALL
  USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'owner'::app_role));

-- =============================================
-- SOCIAL MEDIA / LINKEDIN INSIGHTS
-- =============================================

CREATE TABLE public.hr_linkedin_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL, -- competitor, talent, connection_request, opportunity
  source_profile_url TEXT,
  profile_name TEXT,
  profile_title TEXT,
  company TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_fake BOOLEAN DEFAULT false,
  fake_indicators TEXT[],
  relevance_score INTEGER, -- 0-100
  action_taken TEXT, -- accepted, declined, flagged, contacted
  action_taken_by TEXT, -- HR, Amanda, etc.
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.hr_linkedin_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage insights"
  ON public.hr_linkedin_insights FOR ALL
  USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'owner'::app_role));

-- Competitor tracking
CREATE TABLE public.hr_competitor_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  registration_date DATE,
  is_new_company BOOLEAN DEFAULT false,
  employee_count INTEGER,
  top_brokers TEXT[],
  notable_achievements TEXT[],
  threat_level TEXT, -- low, medium, high
  notes TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.hr_competitor_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and admins can manage competitors"
  ON public.hr_competitor_tracking FOR ALL
  USING (public.is_hr_manager(auth.uid()) OR public.has_role(auth.uid(), 'owner'::app_role));

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_hr_job_offers_updated_at
  BEFORE UPDATE ON public.hr_job_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_daily_metrics_updated_at
  BEFORE UPDATE ON public.employee_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_salary_benchmarks_updated_at
  BEFORE UPDATE ON public.hr_salary_benchmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_job_applicants_updated_at
  BEFORE UPDATE ON public.hr_job_applicants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_linkedin_insights_updated_at
  BEFORE UPDATE ON public.hr_linkedin_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_competitor_tracking_updated_at
  BEFORE UPDATE ON public.hr_competitor_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();