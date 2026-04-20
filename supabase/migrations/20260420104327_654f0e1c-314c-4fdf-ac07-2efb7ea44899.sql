-- 1. Fix esign_recipients UPDATE policy
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'esign_recipients' AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.esign_recipients', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Envelope sender can update recipients"
ON public.esign_recipients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.esign_envelopes e
    WHERE e.id = esign_recipients.envelope_id
      AND e.sender_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.esign_envelopes e
    WHERE e.id = esign_recipients.envelope_id
      AND e.sender_id = auth.uid()
  )
);

CREATE POLICY "Token holder can update own recipient row"
ON public.esign_recipients
FOR UPDATE
TO anon, authenticated
USING (
  signing_token IS NOT NULL
  AND signing_token = ((current_setting('request.headers'::text, true))::json ->> 'x-signing-token'::text)::uuid
)
WITH CHECK (
  signing_token IS NOT NULL
  AND signing_token = ((current_setting('request.headers'::text, true))::json ->> 'x-signing-token'::text)::uuid
);

-- 2. Restrict areas write access to admin / listing_admin roles
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'areas' AND cmd IN ('INSERT','UPDATE','DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.areas', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can insert areas"
ON public.areas
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'listing_admin'::app_role)
);

CREATE POLICY "Admins can update areas"
ON public.areas
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'listing_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'listing_admin'::app_role)
);

CREATE POLICY "Admins can delete areas"
ON public.areas
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'listing_admin'::app_role)
);

-- 3. Lock down Realtime channel subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users receive own-scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    realtime.topic() LIKE '%' || auth.uid()::text || '%'
    OR realtime.topic() LIKE 'public-%'
  )
);