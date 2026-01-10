-- =============================================
-- HR CANDIDATES & EMPLOYEE CENTER TABLES
-- =============================================

-- Create hr_candidates table for CV storage and recruitment tracking
CREATE TABLE IF NOT EXISTS public.hr_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Owner/recruiter who added this candidate
  candidate_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position_applied TEXT NOT NULL,
  cv_file_url TEXT,
  cv_file_name TEXT,
  cover_letter_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'analyzed', 'interview_scheduled', 'interviewed', 'shortlisted', 'approved', 'rejected', 'on_hold')),
  
  -- AI Analysis Fields
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_ranking INTEGER,
  ai_analysis JSONB,
  
  -- Interview Fields
  interview_stage TEXT CHECK (interview_stage IN ('first', 'second', 'completed')),
  first_interview_date TIMESTAMPTZ,
  first_interview_notes TEXT,
  first_interviewer_decision TEXT CHECK (first_interviewer_decision IN ('approve', 'reject', 'hold', 'pending')),
  second_interview_date TIMESTAMPTZ,
  second_interview_notes TEXT,
  second_interviewer_decision TEXT CHECK (second_interviewer_decision IN ('approve', 'reject', 'hold', 'pending')),
  
  -- Interview Recording (URLs to encrypted storage)
  first_interview_recording_url TEXT,
  second_interview_recording_url TEXT,
  
  -- Final Decision
  final_decision TEXT CHECK (final_decision IN ('approved', 'rejected', 'on_hold')),
  final_decision_notes TEXT,
  final_decision_by UUID,
  final_decision_date TIMESTAMPTZ,
  
  -- Metadata
  experience_years INTEGER,
  education_level TEXT,
  skills TEXT[],
  certifications TEXT[],
  source TEXT DEFAULT 'direct',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create hr_interview_invitations table for tracking sent invitations
CREATE TABLE IF NOT EXISTS public.hr_interview_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.hr_candidates(id) ON DELETE CASCADE,
  interview_stage TEXT NOT NULL CHECK (interview_stage IN ('first', 'second')),
  interviewer_name TEXT NOT NULL,
  interviewer_title TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  calendar_event_id TEXT,
  
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMPTZ,
  calendar_added BOOLEAN DEFAULT false,
  
  candidate_confirmed BOOLEAN,
  candidate_confirmed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create hr_employees table for approved candidates who became employees
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.hr_candidates(id),
  user_id UUID,
  
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT NOT NULL,
  department TEXT,
  
  start_date DATE,
  employee_status TEXT DEFAULT 'active' CHECK (employee_status IN ('active', 'probation', 'terminated', 'resigned')),
  
  cv_url TEXT,
  skills TEXT[],
  certifications TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_interview_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hr_candidates using crm_users_profile
CREATE POLICY "hr_candidates_admin_select"
ON public.hr_candidates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid()
    AND crm_users_profile.crm_role IN ('owner_admin', 'admin')
    AND crm_users_profile.is_active = true
  )
);

CREATE POLICY "hr_candidates_user_select"
ON public.hr_candidates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "hr_candidates_insert"
ON public.hr_candidates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hr_candidates_update"
ON public.hr_candidates
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid()
    AND crm_users_profile.crm_role IN ('owner_admin', 'admin')
    AND crm_users_profile.is_active = true
  )
);

-- RLS Policies for hr_interview_invitations
CREATE POLICY "hr_invitations_admin_all"
ON public.hr_interview_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid()
    AND crm_users_profile.crm_role IN ('owner_admin', 'admin')
    AND crm_users_profile.is_active = true
  )
);

CREATE POLICY "hr_invitations_creator_select"
ON public.hr_interview_invitations
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "hr_invitations_creator_insert"
ON public.hr_interview_invitations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- RLS Policies for hr_employees
CREATE POLICY "hr_employees_admin_all"
ON public.hr_employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid()
    AND crm_users_profile.crm_role IN ('owner_admin', 'admin')
    AND crm_users_profile.is_active = true
  )
);

CREATE POLICY "hr_employees_creator_select"
ON public.hr_employees
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_candidates_user_id ON public.hr_candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_status ON public.hr_candidates(status);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_position ON public.hr_candidates(position_applied);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_ai_ranking ON public.hr_candidates(ai_ranking);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_created_at ON public.hr_candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hr_invitations_candidate ON public.hr_interview_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON public.hr_employees(employee_status);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS hr_candidates_updated_at ON public.hr_candidates;
CREATE TRIGGER hr_candidates_updated_at
  BEFORE UPDATE ON public.hr_candidates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS hr_employees_updated_at ON public.hr_employees;
CREATE TRIGGER hr_employees_updated_at
  BEFORE UPDATE ON public.hr_employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create secure storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hr-secure-documents',
  'hr-secure-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'video/webm', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for hr-secure-documents bucket
CREATE POLICY "hr_docs_admin_access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'hr-secure-documents' AND
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid()
    AND crm_users_profile.crm_role IN ('owner_admin', 'admin')
    AND crm_users_profile.is_active = true
  )
);

CREATE POLICY "hr_docs_user_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hr-secure-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "hr_docs_user_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'hr-secure-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);