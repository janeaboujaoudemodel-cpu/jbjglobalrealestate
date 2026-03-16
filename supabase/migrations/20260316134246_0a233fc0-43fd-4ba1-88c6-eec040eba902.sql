
-- FIX 2: esign_recipients - remove unconditional public SELECT
DROP POLICY IF EXISTS "Public can view by signing token" ON public.esign_recipients;
DROP POLICY IF EXISTS "Public can view recipients via signing token" ON public.esign_recipients;

CREATE POLICY "Token holders can view own recipient record" ON public.esign_recipients
  FOR SELECT TO anon, authenticated
  USING (
    signing_token IS NOT NULL
    AND signing_token = (current_setting('request.headers', true)::json->>'x-signing-token')::uuid
  );

-- FIX 3: employee_chat_messages - fix hardcoded 'current-user'
DROP POLICY IF EXISTS "Employees can view own chat messages" ON public.employee_chat_messages;
DROP POLICY IF EXISTS "Employees can insert own chat messages" ON public.employee_chat_messages;
DROP POLICY IF EXISTS "Employees can update own chat messages" ON public.employee_chat_messages;

CREATE POLICY "Employees can view own chat messages" ON public.employee_chat_messages
  FOR SELECT TO authenticated
  USING (sender_id = (auth.uid())::text OR recipient_id = (auth.uid())::text);

CREATE POLICY "Employees can insert own chat messages" ON public.employee_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (auth.uid())::text);

CREATE POLICY "Employees can update own chat messages" ON public.employee_chat_messages
  FOR UPDATE TO authenticated
  USING (sender_id = (auth.uid())::text OR recipient_id = (auth.uid())::text);

-- FIX 4: user_downloads & user_uploads - scope to own data
DROP POLICY IF EXISTS "Authenticated users can view downloads" ON public.user_downloads;
CREATE POLICY "Users can view own downloads" ON public.user_downloads
  FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text OR user_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can view uploads" ON public.user_uploads;
CREATE POLICY "Users can view own uploads" ON public.user_uploads
  FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text);
