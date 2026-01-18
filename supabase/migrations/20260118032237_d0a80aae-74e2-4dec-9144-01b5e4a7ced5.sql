-- Create employee_reports table for comprehensive report tracking
CREATE TABLE IF NOT EXISTS public.employee_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  reporter_name TEXT NOT NULL,
  department TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'daily',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'flagged', 'archived')),
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  content JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  highlights TEXT[],
  concerns TEXT[],
  action_items TEXT[],
  ceo_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_reports_date ON public.employee_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_employee_reports_reporter ON public.employee_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_employee_reports_department ON public.employee_reports(department);
CREATE INDEX IF NOT EXISTS idx_employee_reports_status ON public.employee_reports(status);

-- Enable RLS
ALTER TABLE public.employee_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view reports (admin access)
CREATE POLICY "Authenticated users can view reports"
  ON public.employee_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert reports
CREATE POLICY "Authenticated users can insert reports"
  ON public.employee_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update reports
CREATE POLICY "Authenticated users can update reports"
  ON public.employee_reports
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create user_behavior_tracking table for comprehensive user insights
CREATE TABLE IF NOT EXISTS public.user_behavior_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_target TEXT,
  page_url TEXT,
  page_title TEXT,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  click_count INTEGER DEFAULT 1,
  scroll_depth INTEGER,
  time_spent_seconds INTEGER,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  building_name TEXT,
  exact_location JSONB,
  nationality TEXT,
  language_used TEXT,
  language_changes JSONB DEFAULT '[]',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for behavior tracking
CREATE INDEX IF NOT EXISTS idx_behavior_session ON public.user_behavior_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_user ON public.user_behavior_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_date ON public.user_behavior_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_action ON public.user_behavior_tracking(action_type);

-- Enable RLS
ALTER TABLE public.user_behavior_tracking ENABLE ROW LEVEL SECURITY;

-- Allow inserting behavior data (public for visitor tracking)
CREATE POLICY "Anyone can insert behavior data"
  ON public.user_behavior_tracking
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read behavior data
CREATE POLICY "Authenticated users can view behavior data"
  ON public.user_behavior_tracking
  FOR SELECT
  TO authenticated
  USING (true);

-- Create forms_submissions table for all form data
CREATE TABLE IF NOT EXISTS public.forms_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL,
  form_name TEXT NOT NULL,
  submitter_name TEXT,
  submitter_email TEXT,
  submitter_phone TEXT,
  submission_data JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  exact_location JSONB,
  session_id TEXT,
  page_source TEXT,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_forms_type ON public.forms_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_forms_date ON public.forms_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_forms_email ON public.forms_submissions(submitter_email);

-- Enable RLS
ALTER TABLE public.forms_submissions ENABLE ROW LEVEL SECURITY;

-- Allow inserting form submissions (public for visitors)
CREATE POLICY "Anyone can submit forms"
  ON public.forms_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can view form submissions
CREATE POLICY "Authenticated users can view form submissions"
  ON public.forms_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_downloads table for tracking all downloads
CREATE TABLE IF NOT EXISTS public.user_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  download_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  download_source TEXT,
  is_user_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log downloads"
  ON public.user_downloads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view downloads"
  ON public.user_downloads
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_uploads table for tracking all uploads
CREATE TABLE IF NOT EXISTS public.user_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  upload_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  upload_source TEXT,
  is_processed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can upload"
  ON public.user_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view uploads"
  ON public.user_uploads
  FOR SELECT
  TO authenticated
  USING (true);

-- Add trigger for updated_at on employee_reports
CREATE OR REPLACE FUNCTION public.update_employee_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_employee_reports_updated_at ON public.employee_reports;
CREATE TRIGGER update_employee_reports_updated_at
  BEFORE UPDATE ON public.employee_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_reports_updated_at();