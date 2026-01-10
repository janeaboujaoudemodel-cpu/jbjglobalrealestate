-- Create JBJ Hub Analytics table for tracking tool usage and performance metrics
CREATE TABLE IF NOT EXISTS public.jbj_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  tool_name TEXT NOT NULL,
  tool_category TEXT,
  action_type TEXT NOT NULL DEFAULT 'view', -- view, use, complete, error
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_jbj_analytics_tool_name ON public.jbj_analytics(tool_name);
CREATE INDEX idx_jbj_analytics_created_at ON public.jbj_analytics(created_at);
CREATE INDEX idx_jbj_analytics_user_id ON public.jbj_analytics(user_id);

-- Enable RLS
ALTER TABLE public.jbj_analytics ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics (for usage tracking)
CREATE POLICY "Users can insert their own analytics"
ON public.jbj_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins/owners can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.jbj_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'owner')
  )
);

-- Create issue reports table for "Report a Problem" functionality
CREATE TABLE IF NOT EXISTS public.jbj_issue_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  tool_name TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  issue_category TEXT, -- technical, design, data, other
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jbj_issue_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert issue reports
CREATE POLICY "Users can insert issue reports"
ON public.jbj_issue_reports
FOR INSERT
WITH CHECK (true);

-- Users can view their own issue reports
CREATE POLICY "Users can view their own issue reports"
ON public.jbj_issue_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all issue reports
CREATE POLICY "Admins can view all issue reports"
ON public.jbj_issue_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'owner')
  )
);

-- Admins can update issue reports
CREATE POLICY "Admins can update issue reports"
ON public.jbj_issue_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'owner')
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_jbj_issue_reports_updated_at
BEFORE UPDATE ON public.jbj_issue_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();