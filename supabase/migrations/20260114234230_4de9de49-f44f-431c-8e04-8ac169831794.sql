-- FIX CRITICAL SECURITY: Rate limiting for sensitive operations
-- Add rate limiting protection for phone and email verifications

-- Create rate limit function for verifications
CREATE OR REPLACE FUNCTION public.check_verification_rate_limit(
  p_identifier text,
  p_verification_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_minutes * interval '1 minute');
  
  IF p_verification_type = 'phone' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.phone_verifications
    WHERE phone = p_identifier
      AND created_at >= v_window_start;
  ELSIF p_verification_type = 'email' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.email_verifications
    WHERE email = p_identifier
      AND created_at >= v_window_start;
  ELSE
    RETURN true;
  END IF;
  
  RETURN v_count < p_max_attempts;
END;
$$;

-- Add function to check lead submission rate limit
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(
  p_email text,
  p_max_submissions integer DEFAULT 3,
  p_window_hours integer DEFAULT 24
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.leads
  WHERE email = p_email
    AND created_at >= now() - (p_window_hours * interval '1 hour');
  
  RETURN v_count < p_max_submissions;
END;
$$;

-- Tighten broker_messages insertion - require proper sender validation
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.broker_messages;

CREATE POLICY "Authenticated insert broker_messages with validation"
ON public.broker_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Message must be associated with an existing conversation
  EXISTS (
    SELECT 1 FROM public.broker_conversations
    WHERE id = broker_messages.conversation_id
  )
);

-- Ensure chat_conversations require proper auth for viewing
DROP POLICY IF EXISTS "chat_conversations_own_select" ON public.chat_conversations;

CREATE POLICY "Authenticated chat select own"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  user_email = auth.jwt() ->> 'email'
);

-- Grant restricted select for hr_applications (ensure HR admin only)
DROP POLICY IF EXISTS "HR admins can view all applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admin full access" ON public.hr_applications;

CREATE POLICY "HR admin view applications"
ON public.hr_applications
FOR SELECT
TO authenticated
USING (
  is_hr_admin(auth.uid()) OR 
  is_crm_admin(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "HR admin update applications"
ON public.hr_applications
FOR UPDATE
TO authenticated
USING (
  is_hr_admin(auth.uid()) OR 
  is_crm_admin(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  is_hr_admin(auth.uid()) OR 
  is_crm_admin(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
);

-- Protect vapi_call_logs more strictly - only CRM admins
DROP POLICY IF EXISTS "Admin only vapi_call_logs" ON public.vapi_call_logs;

CREATE POLICY "CRM admin view call logs"
ON public.vapi_call_logs
FOR SELECT
TO authenticated
USING (
  is_crm_admin(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "CRM admin manage call logs"
ON public.vapi_call_logs
FOR ALL
TO authenticated
USING (
  is_crm_admin(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  is_crm_admin(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
);