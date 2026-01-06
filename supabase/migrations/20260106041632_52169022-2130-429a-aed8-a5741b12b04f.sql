-- Create enum for action types
CREATE TYPE public.audit_action_type AS ENUM (
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'import',
  'approve',
  'reject',
  'block',
  'unblock'
);

-- Create enum for resource types
CREATE TYPE public.audit_resource_type AS ENUM (
  'user',
  'project',
  'subscription',
  'lead',
  'discount_code',
  'ip_blocklist',
  'rate_limit',
  'document',
  'settings',
  'role'
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action_type audit_action_type NOT NULL,
  resource_type audit_resource_type NOT NULL,
  resource_id TEXT,
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs(resource_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert their own audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- No one can update or delete audit logs (immutable for compliance)
-- (No UPDATE or DELETE policies = denied by default with RLS enabled)