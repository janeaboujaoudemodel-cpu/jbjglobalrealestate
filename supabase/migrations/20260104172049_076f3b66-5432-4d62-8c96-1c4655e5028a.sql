-- Fix: Allow anonymous users to create evaluation requests
-- The current policy fails for anonymous users because NULL = NULL evaluates to NULL in PostgreSQL

DROP POLICY IF EXISTS "Users can create evaluation requests" ON public.evaluation_requests;

CREATE POLICY "Users can create evaluation requests" 
ON public.evaluation_requests 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);