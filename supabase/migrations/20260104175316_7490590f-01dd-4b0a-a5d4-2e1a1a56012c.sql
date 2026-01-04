-- Fix: Make quiz_responses more restrictive - drop existing and recreate
DROP POLICY IF EXISTS "Users can view their own quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Anyone can view their anonymous quiz responses" ON public.quiz_responses;

CREATE POLICY "Users can view their own quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);