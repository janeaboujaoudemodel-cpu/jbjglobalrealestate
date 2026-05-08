
-- Fix #1: Remove unauthenticated UPDATE on meeting_requests (token never verified)
DROP POLICY IF EXISTS "Public can confirm meeting request by invite token" ON public.meeting_requests;

-- Fix #2: Restrict crm_brokers SELECT to admins/owners (drop blanket auth=true)
DROP POLICY IF EXISTS "Authenticated users can view brokers" ON public.crm_brokers;

-- Fix #3: Restrict jbj_brokers SELECT (drop blanket auth=true; admin manage policy still allows admins; brokers may read own)
DROP POLICY IF EXISTS "Authenticated users can view brokers" ON public.jbj_brokers;

CREATE POLICY "Brokers can view their own row"
ON public.jbj_brokers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Fix #4: Realtime - drop public-% wildcard, keep user-scoped topics
DROP POLICY IF EXISTS "Authenticated users receive own-scoped channels" ON realtime.messages;

CREATE POLICY "Authenticated users receive own-scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND realtime.topic() LIKE ('%' || auth.uid()::text || '%')
);
