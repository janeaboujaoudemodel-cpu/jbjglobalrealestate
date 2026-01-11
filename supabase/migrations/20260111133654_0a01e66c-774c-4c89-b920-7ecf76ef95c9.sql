-- Harden public INSERT policies with proper validation

-- 1. chat_conversations - require valid email format
DROP POLICY IF EXISTS "chat_public_insert_secure" ON chat_conversations;
CREATE POLICY "chat_public_insert_validated" ON chat_conversations
FOR INSERT TO anon, authenticated
WITH CHECK (
  user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(user_email)
  AND length(user_email) <= 255
);

-- 2. evaluation_requests - require valid email format
DROP POLICY IF EXISTS "evaluation_public_insert" ON evaluation_requests;
CREATE POLICY "evaluation_public_insert_validated" ON evaluation_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(user_email)
  AND length(user_email) <= 255
);

-- 3. hr_applications - require valid email and phone format
DROP POLICY IF EXISTS "hr_applications_public_insert" ON hr_applications;
CREATE POLICY "hr_applications_public_insert_validated" ON hr_applications
FOR INSERT TO anon, authenticated
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(email)
  AND length(email) <= 255
  AND length(full_name) >= 2
  AND length(full_name) <= 100
  AND consent_accurate = true
  AND consent_terms = true
);

-- 4. vapi_call_logs - require valid call_id (from VAPI webhook)
DROP POLICY IF EXISTS "vapi_public_insert" ON vapi_call_logs;
CREATE POLICY "vapi_public_insert_validated" ON vapi_call_logs
FOR INSERT TO anon, authenticated
WITH CHECK (
  call_id IS NOT NULL
  AND length(call_id) >= 10
  AND length(call_id) <= 100
);