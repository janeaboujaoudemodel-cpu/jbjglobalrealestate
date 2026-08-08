-- 1. chat_conversations: prevent anonymous identity spoofing being treated as verified
ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS identity_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.chat_conversations_set_identity_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_email text;
BEGIN
  jwt_email := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';

  -- Identity can only be considered verified when the row belongs to the
  -- authenticated caller AND the stored email matches the verified JWT email.
  NEW.identity_verified :=
    auth.uid() IS NOT NULL
    AND NEW.user_id = auth.uid()
    AND jwt_email IS NOT NULL
    AND lower(NEW.user_email) = lower(jwt_email);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_conversations_identity_verified_ins ON public.chat_conversations;
CREATE TRIGGER chat_conversations_identity_verified_ins
BEFORE INSERT ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.chat_conversations_set_identity_verified();

DROP TRIGGER IF EXISTS chat_conversations_identity_verified_upd ON public.chat_conversations;
CREATE TRIGGER chat_conversations_identity_verified_upd
BEFORE UPDATE OF user_email, user_id, identity_verified ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.chat_conversations_set_identity_verified();

-- Anonymous inserts must stay unverified and must not claim a blocked/owner identity
DROP POLICY IF EXISTS chat_conversations_anon_insert ON public.chat_conversations;
CREATE POLICY chat_conversations_anon_insert
ON public.chat_conversations
FOR INSERT
TO anon
WITH CHECK (
  user_email IS NOT NULL
  AND user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT is_email_domain_blocked(user_email)
  AND check_rate_limit(COALESCE(user_email, 'anon'), 'chat_conversation', 10, 60)
  AND user_id IS NULL
  AND identity_verified = false
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(chat_conversations.user_email)
  )
);

-- 2. training_completions: owner role must see audit records
DROP POLICY IF EXISTS training_completions_admin_select ON public.training_completions;
CREATE POLICY training_completions_admin_select
ON public.training_completions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);