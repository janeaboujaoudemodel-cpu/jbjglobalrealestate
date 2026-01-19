-- Create scheduled reports table for email scheduling
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'analytics',
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  recipients TEXT[] NOT NULL DEFAULT '{}',
  next_send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  report_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report delivery logs
CREATE TABLE public.report_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_report_id UUID NOT NULL REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipients TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_reports
CREATE POLICY "Users can view their own scheduled reports" 
ON public.scheduled_reports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled reports" 
ON public.scheduled_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled reports" 
ON public.scheduled_reports FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled reports" 
ON public.scheduled_reports FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for report_delivery_logs
CREATE POLICY "Users can view their own report delivery logs" 
ON public.report_delivery_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.scheduled_reports sr 
    WHERE sr.id = scheduled_report_id AND sr.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_scheduled_reports_user_id ON public.scheduled_reports(user_id);
CREATE INDEX idx_scheduled_reports_next_send_at ON public.scheduled_reports(next_send_at) WHERE is_active = true;
CREATE INDEX idx_report_delivery_logs_scheduled_report_id ON public.report_delivery_logs(scheduled_report_id);

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_reports_updated_at
BEFORE UPDATE ON public.scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();