
-- =========================================================================
-- SECURITY HARDENING MIGRATION - Final Cleanup
-- Drop existing conflicting function and create security audit table
-- =========================================================================

-- 1. Drop all existing versions of log_security_event function
DROP FUNCTION IF EXISTS public.log_security_event(text, text, text, text, jsonb, text);
DROP FUNCTION IF EXISTS public.log_security_event(text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.log_security_event(text, text);

-- 2. Create security_audit_log table if not exists
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  user_email text,
  ip_address inet,
  user_agent text,
  resource_type text,
  resource_id text,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies first
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_log;

-- 5. Create policies
CREATE POLICY "Admins can view security logs"
ON public.security_audit_log FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "System can insert security logs"
ON public.security_audit_log FOR INSERT
WITH CHECK (true);

-- 6. Add indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at 
ON public.security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id 
ON public.security_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type 
ON public.security_audit_log(event_type);

-- 7. Create the security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_user_id uuid;
  v_user_email text;
BEGIN
  v_user_id := auth.uid();
  v_user_email := auth.email();
  
  INSERT INTO public.security_audit_log (
    event_type, user_id, user_email,
    resource_type, resource_id, action, details, severity
  ) VALUES (
    p_event_type, v_user_id, v_user_email,
    p_resource_type, p_resource_id, p_action, p_details, p_severity
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 8. Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, text, jsonb, text) TO authenticated;
