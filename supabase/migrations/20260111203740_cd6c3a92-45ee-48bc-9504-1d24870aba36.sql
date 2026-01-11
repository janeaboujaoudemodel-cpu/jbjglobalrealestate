-- Fix the vapi_call_logs INSERT policy with correct column validation
-- The previous policies for chat_conversations, email_verifications, and leads were already applied

DROP POLICY IF EXISTS "System can insert call logs" ON public.vapi_call_logs;
CREATE POLICY "System can insert call logs with validation"
ON public.vapi_call_logs
FOR INSERT
TO anon
WITH CHECK (
  -- Require call_id to be present and valid
  call_id IS NOT NULL
  AND length(call_id) > 10
);