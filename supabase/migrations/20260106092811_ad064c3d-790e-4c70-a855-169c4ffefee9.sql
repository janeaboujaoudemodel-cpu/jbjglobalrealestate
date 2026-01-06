-- HR Onboarding MVP Schema
-- Phase 1-2: Applications, Modules, Quizzes, Scoring

-- Create HR role enum
CREATE TYPE public.hr_role AS ENUM ('broker_candidate', 'broker_member');

-- Create application status enum
CREATE TYPE public.hr_application_status AS ENUM ('pending', 'approved', 'rejected');

-- Create quiz question type enum
CREATE TYPE public.hr_question_type AS ENUM ('mcq', 'true_false', 'short_answer');

-- Create module track enum
CREATE TYPE public.hr_module_track AS ENUM ('company_knowledge', 'real_estate_basics');

-- ============================================
-- Table: hr_applications
-- Stores candidate applications
-- ============================================
CREATE TABLE public.hr_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status hr_application_status NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  nationality TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  current_location_country TEXT NOT NULL,
  current_location_city TEXT NOT NULL,
  cv_url TEXT,
  consent_accurate BOOLEAN NOT NULL DEFAULT false,
  consent_terms BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- Table: hr_user_roles
-- Tracks HR-specific roles for users
-- ============================================
CREATE TABLE public.hr_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role hr_role NOT NULL DEFAULT 'broker_candidate',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- Table: hr_modules
-- Training module content
-- ============================================
CREATE TABLE public.hr_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track hr_module_track NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Table: hr_quiz_questions
-- Quiz questions per module
-- ============================================
CREATE TABLE public.hr_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.hr_modules(id) ON DELETE CASCADE,
  question_type hr_question_type NOT NULL DEFAULT 'mcq',
  question TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Table: hr_quiz_attempts
-- Records of quiz attempts by users
-- ============================================
CREATE TABLE public.hr_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.hr_modules(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Table: hr_settings
-- Configurable settings (pass thresholds)
-- ============================================
CREATE TABLE public.hr_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default pass thresholds
INSERT INTO public.hr_settings (setting_key, setting_value) VALUES
  ('pass_threshold_company', '{"percentage": 70}'::jsonb),
  ('pass_threshold_real_estate', '{"percentage": 70}'::jsonb),
  ('pass_threshold_combined', '{"percentage": 70}'::jsonb);

-- ============================================
-- Table: hr_audit_logs
-- Audit trail for admin actions
-- ============================================
CREATE TABLE public.hr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_hr_applications_user_id ON public.hr_applications(user_id);
CREATE INDEX idx_hr_applications_status ON public.hr_applications(status);
CREATE INDEX idx_hr_user_roles_user_id ON public.hr_user_roles(user_id);
CREATE INDEX idx_hr_modules_track ON public.hr_modules(track);
CREATE INDEX idx_hr_quiz_questions_module_id ON public.hr_quiz_questions(module_id);
CREATE INDEX idx_hr_quiz_attempts_user_id ON public.hr_quiz_attempts(user_id);
CREATE INDEX idx_hr_quiz_attempts_module_id ON public.hr_quiz_attempts(module_id);

-- ============================================
-- Helper Functions (SECURITY DEFINER)
-- ============================================

-- Check if user is HR admin (has app_role admin)
CREATE OR REPLACE FUNCTION public.is_hr_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Check if user has HR role
CREATE OR REPLACE FUNCTION public.get_hr_role(_user_id UUID)
RETURNS hr_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.hr_user_roles
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Check if user is approved broker member
CREATE OR REPLACE FUNCTION public.is_hr_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hr_user_roles
    WHERE user_id = _user_id AND role = 'broker_member' AND is_active = true
  )
$$;

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.hr_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: hr_applications
-- ============================================
-- Users can view their own application
CREATE POLICY "hr_applications_select_own" ON public.hr_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own application
CREATE POLICY "hr_applications_insert_own" ON public.hr_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending application
CREATE POLICY "hr_applications_update_own" ON public.hr_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "hr_applications_admin_select" ON public.hr_applications
  FOR SELECT USING (is_hr_admin(auth.uid()));

-- Admins can update any application (for approval/rejection)
CREATE POLICY "hr_applications_admin_update" ON public.hr_applications
  FOR UPDATE USING (is_hr_admin(auth.uid()));

-- ============================================
-- RLS Policies: hr_user_roles
-- ============================================
-- Users can view their own role
CREATE POLICY "hr_user_roles_select_own" ON public.hr_user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "hr_user_roles_admin_all" ON public.hr_user_roles
  FOR ALL USING (is_hr_admin(auth.uid()));

-- ============================================
-- RLS Policies: hr_modules
-- ============================================
-- Approved members can view active modules
CREATE POLICY "hr_modules_member_select" ON public.hr_modules
  FOR SELECT USING (is_hr_member(auth.uid()) AND is_active = true);

-- Admins can manage all modules
CREATE POLICY "hr_modules_admin_all" ON public.hr_modules
  FOR ALL USING (is_hr_admin(auth.uid()));

-- ============================================
-- RLS Policies: hr_quiz_questions
-- ============================================
-- Approved members can view active questions
CREATE POLICY "hr_quiz_questions_member_select" ON public.hr_quiz_questions
  FOR SELECT USING (is_hr_member(auth.uid()) AND is_active = true);

-- Admins can manage all questions
CREATE POLICY "hr_quiz_questions_admin_all" ON public.hr_quiz_questions
  FOR ALL USING (is_hr_admin(auth.uid()));

-- ============================================
-- RLS Policies: hr_quiz_attempts
-- ============================================
-- Users can view their own attempts
CREATE POLICY "hr_quiz_attempts_select_own" ON public.hr_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Approved members can insert their own attempts
CREATE POLICY "hr_quiz_attempts_insert_own" ON public.hr_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_hr_member(auth.uid()));

-- Admins can view all attempts
CREATE POLICY "hr_quiz_attempts_admin_select" ON public.hr_quiz_attempts
  FOR SELECT USING (is_hr_admin(auth.uid()));

-- ============================================
-- RLS Policies: hr_settings
-- ============================================
-- Approved members can view settings
CREATE POLICY "hr_settings_member_select" ON public.hr_settings
  FOR SELECT USING (is_hr_member(auth.uid()));

-- Admins can manage settings
CREATE POLICY "hr_settings_admin_all" ON public.hr_settings
  FOR ALL USING (is_hr_admin(auth.uid()));

-- ============================================
-- RLS Policies: hr_audit_logs
-- ============================================
-- Admins can insert audit logs
CREATE POLICY "hr_audit_logs_admin_insert" ON public.hr_audit_logs
  FOR INSERT WITH CHECK (is_hr_admin(auth.uid()));

-- Admins can view audit logs
CREATE POLICY "hr_audit_logs_admin_select" ON public.hr_audit_logs
  FOR SELECT USING (is_hr_admin(auth.uid()));

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_hr_applications_updated_at
  BEFORE UPDATE ON public.hr_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_user_roles_updated_at
  BEFORE UPDATE ON public.hr_user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_modules_updated_at
  BEFORE UPDATE ON public.hr_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_settings_updated_at
  BEFORE UPDATE ON public.hr_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();