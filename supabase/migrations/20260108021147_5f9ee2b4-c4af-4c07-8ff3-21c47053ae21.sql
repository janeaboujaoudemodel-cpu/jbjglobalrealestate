-- Create table for VAPI call logs with AI auditing
CREATE TABLE public.vapi_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT NOT NULL UNIQUE,
  caller_phone TEXT,
  caller_name TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  summary TEXT,
  recording_url TEXT,
  
  -- AI Audit fields
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_issues TEXT[],
  ai_highlights TEXT[],
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  ai_lead_quality TEXT CHECK (ai_lead_quality IN ('hot', 'warm', 'cold', 'unqualified')),
  ai_summary TEXT,
  ai_follow_up_recommended BOOLEAN DEFAULT false,
  ai_audited_at TIMESTAMPTZ,
  
  -- Lead extraction
  extracted_name TEXT,
  extracted_phone TEXT,
  extracted_email TEXT,
  extracted_interest TEXT,
  extracted_budget TEXT,
  lead_id UUID REFERENCES public.crm_leads(id),
  
  -- Flags
  needs_review BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Metadata
  call_status TEXT,
  ended_reason TEXT,
  assistant_name TEXT DEFAULT 'John',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admins/owners to view all calls
CREATE POLICY "Admins can view all call logs"
  ON public.vapi_call_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update call logs"
  ON public.vapi_call_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Index for quick lookups
CREATE INDEX idx_vapi_call_logs_created_at ON public.vapi_call_logs(created_at DESC);
CREATE INDEX idx_vapi_call_logs_needs_review ON public.vapi_call_logs(needs_review) WHERE needs_review = true;
CREATE INDEX idx_vapi_call_logs_is_flagged ON public.vapi_call_logs(is_flagged) WHERE is_flagged = true;

-- Trigger for updated_at
CREATE TRIGGER update_vapi_call_logs_updated_at
  BEFORE UPDATE ON public.vapi_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();