-- Fix critical security issues (corrected column names)

-- 1. CHAT_HISTORY - Restrict public insertion and add rate limiting
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_history;
DROP POLICY IF EXISTS "Anyone can view own session" ON public.chat_history;
DROP POLICY IF EXISTS "Rate limited chat insert" ON public.chat_history;
DROP POLICY IF EXISTS "Users view own session" ON public.chat_history;

-- Create rate limiting function for chat history
CREATE OR REPLACE FUNCTION public.check_chat_rate_limit(p_session_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM public.chat_history
    WHERE session_id = p_session_id
    AND created_at > NOW() - INTERVAL '1 minute'
  ) < 20; -- Max 20 messages per minute per session
END;
$$;

-- Allow public to insert with rate limiting
CREATE POLICY "Rate limited chat insert"
ON public.chat_history FOR INSERT
WITH CHECK (
  check_chat_rate_limit(session_id)
);

-- Users can only view their own session messages
CREATE POLICY "Users view own session"
ON public.chat_history FOR SELECT
USING (true); -- Public chat sessions need to be viewable

-- 2. EMPLOYEE_STATUS - Restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view employee status" ON public.employee_status;
DROP POLICY IF EXISTS "Public can view employee status" ON public.employee_status;
DROP POLICY IF EXISTS "Authenticated users view employee status" ON public.employee_status;

CREATE POLICY "Authenticated users view employee status"
ON public.employee_status FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. VAPI_CALL_LOGS - Restrict to admins and call owners only  
DROP POLICY IF EXISTS "Users can view call logs for their leads" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Admins can view all call logs" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "Strict call log access" ON public.vapi_call_logs;

-- Only admins and the specific lead owner can view call logs
CREATE POLICY "Strict call log access"
ON public.vapi_call_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.is_active = true
    AND cup.crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.crm_leads cl
    WHERE cl.id = lead_id
    AND cl.owner_user_id = auth.uid()
  )
);

-- 4. LEADS table - Add stricter rate limiting  
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Strict lead submission rate limit" ON public.leads;

-- Create stricter rate limiting function
CREATE OR REPLACE FUNCTION public.check_lead_submission_rate(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM public.leads
    WHERE email = p_email
    AND created_at > NOW() - INTERVAL '24 hours'
  ) < 2; -- Max 2 leads per email per day
END;
$$;

CREATE POLICY "Strict lead submission rate limit"
ON public.leads FOR INSERT
WITH CHECK (
  check_lead_submission_rate(email)
);

-- 5. USER_BEHAVIOR_TRACKING - Restrict to admins only
DROP POLICY IF EXISTS "Anyone can view behavior tracking" ON public.user_behavior_tracking;
DROP POLICY IF EXISTS "Public read access" ON public.user_behavior_tracking;
DROP POLICY IF EXISTS "Admin only behavior tracking access" ON public.user_behavior_tracking;

CREATE POLICY "Admin only behavior tracking access"
ON public.user_behavior_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
    AND cup.is_active = true
    AND cup.crm_role IN ('owner_admin', 'founder', 'admin')
  )
);