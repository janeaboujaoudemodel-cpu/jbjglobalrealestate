-- Create hr_access_logs table to audit all access to sensitive HR data
CREATE TABLE IF NOT EXISTS public.hr_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  access_type TEXT NOT NULL, -- 'view', 'export', 'update', 'delete'
  resource_type TEXT NOT NULL, -- 'hr_employees', 'employee_commissions', etc.
  resource_id UUID,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  records_accessed INTEGER DEFAULT 1,
  metadata JSONB
);

-- Enable RLS on access logs (only founders/owners can view logs)
ALTER TABLE public.hr_access_logs ENABLE ROW LEVEL SECURITY;

-- Only founder/owner can view access logs
CREATE POLICY "Only founder/owner can view HR access logs"
ON public.hr_access_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authenticated users to insert their own access logs (for logging their access)
CREATE POLICY "Authenticated users can log their own access"
ON public.hr_access_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create index for efficient querying
CREATE INDEX idx_hr_access_logs_user_id ON public.hr_access_logs(user_id);
CREATE INDEX idx_hr_access_logs_accessed_at ON public.hr_access_logs(accessed_at DESC);
CREATE INDEX idx_hr_access_logs_resource_type ON public.hr_access_logs(resource_type);

-- Create a function to log HR data access (can be called from edge functions or triggers)
CREATE OR REPLACE FUNCTION public.log_hr_access(
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _access_type TEXT DEFAULT 'view',
  _records_accessed INTEGER DEFAULT 1,
  _metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO _user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  INSERT INTO public.hr_access_logs (
    user_id,
    user_email,
    access_type,
    resource_type,
    resource_id,
    records_accessed,
    metadata
  ) VALUES (
    auth.uid(),
    _user_email,
    _access_type,
    _resource_type,
    _resource_id,
    _records_accessed,
    _metadata
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_hr_access TO authenticated;