-- Fix remaining overly permissive RLS policies

-- 1. Fix chat_conversations INSERT policy
DROP POLICY IF EXISTS "Public can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can create conversations with validation" ON public.chat_conversations;
CREATE POLICY "Validated public conversation creation" 
ON public.chat_conversations
FOR INSERT 
TO anon
WITH CHECK (
  user_email IS NOT NULL 
  AND length(user_email) > 5 
  AND length(user_email) < 256
  AND user_email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  AND status = 'active'
);

-- 2. Fix email_verifications INSERT policy
DROP POLICY IF EXISTS "Public can create verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Public can create verifications with validation" ON public.email_verifications;
CREATE POLICY "Validated public email verification creation"
ON public.email_verifications
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL
  AND length(email) > 5
  AND length(email) < 256
  AND email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  AND otp_code IS NOT NULL
  AND length(otp_code) = 6
  AND expires_at > now()
);

-- 3. Fix leads INSERT policy
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads with validation" ON public.leads;
CREATE POLICY "Validated public lead insertion"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL
  AND length(email) > 5
  AND length(email) < 256
  AND email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
);