-- Tighten RLS to eliminate public/anonymous write paths for sensitive tables

-- 1) evaluation_requests: require authentication for lead submission
DROP POLICY IF EXISTS "Authenticated users can create evaluation requests" ON public.evaluation_requests;
CREATE POLICY "Authenticated users can create evaluation requests"
ON public.evaluation_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2) quiz_responses: require authentication for DB storage (guests can still use local-only flow)
DROP POLICY IF EXISTS "Anyone can create quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Authenticated users can create quiz responses" ON public.quiz_responses;
CREATE POLICY "Authenticated users can create quiz responses"
ON public.quiz_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3) memberships: users should not be able to update payment/status fields directly
DROP POLICY IF EXISTS "Users can update own memberships" ON public.memberships;