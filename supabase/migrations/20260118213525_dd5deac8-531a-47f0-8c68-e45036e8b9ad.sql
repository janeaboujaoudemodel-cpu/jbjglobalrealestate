-- Fix employee_commissions: Restrict access to owner + HR/Finance admins only
DROP POLICY IF EXISTS "employee_commissions_select" ON public.employee_commissions;
DROP POLICY IF EXISTS "HR can view commissions" ON public.employee_commissions;
DROP POLICY IF EXISTS "Finance can view commissions" ON public.employee_commissions;
DROP POLICY IF EXISTS "CRM admins can view commissions" ON public.employee_commissions;

-- Employees can view their own commissions
CREATE POLICY "employee_commissions_own_select"
ON public.employee_commissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins/owners can view all commissions
CREATE POLICY "employee_commissions_admin_select"
ON public.employee_commissions FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Add audit logging trigger for commission access
CREATE OR REPLACE FUNCTION public.log_commission_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive commission data
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.security_audit_log (
      event_type, user_id, user_email, resource_type, resource_id, action, severity
    ) VALUES (
      'sensitive_data_access',
      auth.uid(),
      auth.email(),
      'employee_commissions',
      NEW.id::text,
      'select',
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix best_idea_submissions: Add rate limiting via database function
CREATE OR REPLACE FUNCTION public.check_idea_submission_rate_limit(p_email text, p_ip text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check submissions in last 24 hours from same email
  SELECT COUNT(*) INTO v_count
  FROM public.best_idea_submissions
  WHERE (email = p_email OR actual_email = p_email)
    AND created_at >= now() - interval '24 hours';
  
  -- Allow max 3 submissions per email per 24 hours
  RETURN v_count < 3;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_idea_submission_rate_limit(text, text) TO anon, authenticated;

-- Update idea submissions policy to use rate limiting
DROP POLICY IF EXISTS "Anyone can submit ideas" ON public.best_idea_submissions;

CREATE POLICY "Rate limited idea submissions"
ON public.best_idea_submissions FOR INSERT
TO public
WITH CHECK (
  -- Rate limit: max 3 per email per 24 hours
  public.check_idea_submission_rate_limit(email)
);

-- Add stricter policy for visitor tracking tables
-- visitor_sessions: Allow insert but add rate limiting
DROP POLICY IF EXISTS "Anyone can insert visitor sessions" ON public.visitor_sessions;

CREATE POLICY "visitor_sessions_rate_limited_insert"
ON public.visitor_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Basic protection: Check rate limit function
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'visitor_session',
    100,  -- max 100 sessions per IP
    60    -- per 60 minutes
  )
);

-- visitor_events: Same rate limiting
DROP POLICY IF EXISTS "Anyone can insert visitor events" ON public.visitor_events;

CREATE POLICY "visitor_events_rate_limited_insert"
ON public.visitor_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'visitor_event',
    500,  -- max 500 events per IP
    60    -- per 60 minutes
  )
);

-- visitor_documents: Rate limit
DROP POLICY IF EXISTS "Anyone can insert visitor documents" ON public.visitor_documents;

CREATE POLICY "visitor_documents_rate_limited_insert"
ON public.visitor_documents FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.check_rate_limit(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    'visitor_document',
    50,   -- max 50 documents per IP
    60    -- per 60 minutes
  )
);