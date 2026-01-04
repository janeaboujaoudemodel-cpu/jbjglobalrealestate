-- Fix 1: evaluation_requests - Remove redundant admin check from SELECT (admins already have ALL policy)
DROP POLICY IF EXISTS "Users can view own evaluation requests" ON evaluation_requests;

CREATE POLICY "Users can view own evaluation requests" 
ON evaluation_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix 2: quiz_responses - Require authentication for INSERT (was open to anyone)
DROP POLICY IF EXISTS "Anyone can create quiz responses" ON quiz_responses;

CREATE POLICY "Authenticated users can create quiz responses" 
ON quiz_responses 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);