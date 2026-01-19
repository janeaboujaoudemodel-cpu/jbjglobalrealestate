-- Create web developer tasks table for approval workflow
CREATE TABLE public.web_developer_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'in_progress', 'completed', 'review_needed', 'rejected')),
  assigned_by TEXT NOT NULL CHECK (assigned_by IN ('owner', 'assistant')),
  assigned_by_user_id UUID,
  approved_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changes JSONB DEFAULT '[]'::jsonb,
  version_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create web developer versions table for rollback
CREATE TABLE public.web_developer_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID,
  snapshot JSONB DEFAULT '{}'::jsonb,
  is_current BOOLEAN DEFAULT false
);

-- Create AI outfit change requests table
CREATE TABLE public.ai_outfit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT,
  prompt TEXT NOT NULL,
  original_image_url TEXT,
  generated_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create decision intelligence records table for DB persistence
CREATE TABLE public.decision_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id TEXT NOT NULL UNIQUE,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('market_entry', 'expansion_approval', 'partner_onboarding', 'model_selection')),
  title TEXT NOT NULL,
  description TEXT,
  inputs JSONB NOT NULL,
  outputs JSONB,
  workflow_state TEXT NOT NULL DEFAULT 'draft' CHECK (workflow_state IN ('draft', 'pending_review', 'finalized')),
  is_finalized BOOLEAN DEFAULT false,
  created_by_user_id UUID NOT NULL,
  created_by_role TEXT NOT NULL,
  created_by_email TEXT,
  finalized_by_user_id UUID,
  finalized_by_role TEXT,
  finalized_by_email TEXT,
  reviews JSONB DEFAULT '[]'::jsonb,
  audit_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalized_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payout readiness records table for DB persistence
CREATE TABLE public.payout_readiness_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id TEXT NOT NULL UNIQUE,
  partner_id TEXT NOT NULL,
  partner_type TEXT NOT NULL,
  jurisdiction_id TEXT NOT NULL,
  execution_model TEXT NOT NULL CHECK (execution_model IN ('A', 'B')),
  related_deal_ids TEXT[] DEFAULT '{}',
  related_commission_ids TEXT[] DEFAULT '{}',
  commission_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'approved', 'blocked', 'processing', 'settled')),
  approval_required BOOLEAN DEFAULT true,
  approval_timestamp TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  approver_role TEXT,
  settlement_method TEXT DEFAULT 'pending_configuration',
  internal_notes TEXT,
  block_reason TEXT,
  blocked_by TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payout audit logs table (immutable)
CREATE TABLE public.payout_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id TEXT NOT NULL UNIQUE,
  payout_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'blocked', 'denied', 'error')),
  result_reason TEXT,
  previous_status TEXT,
  new_status TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.web_developer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_developer_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_outfit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_readiness_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_audit_logs ENABLE ROW LEVEL SECURITY;

-- Web developer tasks policies (internal only)
CREATE POLICY "Authenticated users can view web developer tasks"
ON public.web_developer_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create web developer tasks"
ON public.web_developer_tasks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update web developer tasks"
ON public.web_developer_tasks FOR UPDATE
TO authenticated
USING (true);

-- Web developer versions policies
CREATE POLICY "Authenticated users can view versions"
ON public.web_developer_versions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create versions"
ON public.web_developer_versions FOR INSERT
TO authenticated
WITH CHECK (true);

-- AI outfit requests policies (user-specific)
CREATE POLICY "Users can view their own outfit requests"
ON public.ai_outfit_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own outfit requests"
ON public.ai_outfit_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfit requests"
ON public.ai_outfit_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Decision records policies (internal governance)
CREATE POLICY "Authenticated users can view decision records"
ON public.decision_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create decision records"
ON public.decision_records FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update non-finalized decisions"
ON public.decision_records FOR UPDATE
TO authenticated
USING (is_finalized = false);

-- Payout readiness policies (owner only for write)
CREATE POLICY "Authenticated users can view payout readiness"
ON public.payout_readiness_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create payout readiness"
ON public.payout_readiness_records FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payout readiness"
ON public.payout_readiness_records FOR UPDATE
TO authenticated
USING (true);

-- Payout audit logs policies (append-only, read-only for most)
CREATE POLICY "Authenticated users can view payout audit logs"
ON public.payout_audit_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create payout audit logs"
ON public.payout_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_web_developer_tasks_status ON public.web_developer_tasks(status);
CREATE INDEX idx_decision_records_type ON public.decision_records(decision_type);
CREATE INDEX idx_decision_records_state ON public.decision_records(workflow_state);
CREATE INDEX idx_payout_readiness_status ON public.payout_readiness_records(payout_status);
CREATE INDEX idx_payout_readiness_partner ON public.payout_readiness_records(partner_id);
CREATE INDEX idx_payout_audit_logs_payout ON public.payout_audit_logs(payout_id);

-- Update function for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_web_developer_tasks_updated_at
BEFORE UPDATE ON public.web_developer_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decision_records_updated_at
BEFORE UPDATE ON public.decision_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_readiness_updated_at
BEFORE UPDATE ON public.payout_readiness_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();