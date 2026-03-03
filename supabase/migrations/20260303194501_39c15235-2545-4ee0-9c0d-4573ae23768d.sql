-- Fix visitor_sessions SELECT policy that references broker_subscriptions (causes 401 for anon users)
DROP POLICY IF EXISTS "Admin can view all visitor sessions" ON public.visitor_sessions;

-- Replace with proper owner-based policy using get_owner_email()
CREATE POLICY "Owner can view all visitor sessions"
ON public.visitor_sessions
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = public.get_owner_email()
);