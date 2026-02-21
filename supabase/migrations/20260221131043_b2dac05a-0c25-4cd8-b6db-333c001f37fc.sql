
-- Fix 1: Allow users to update their own chat conversations (so messages get saved)
CREATE POLICY "chat_conversations_user_update_own"
ON public.chat_conversations
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Fix 2: Fix CV submissions SELECT to include owner via has_role
DROP POLICY IF EXISTS "Admins can view CV submissions" ON public.hr_cv_submissions;
CREATE POLICY "Owner and admins can view CV submissions"
ON public.hr_cv_submissions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'hr_manager')
  )
);

-- Fix 3: Fix CV submissions UPDATE to include owner
DROP POLICY IF EXISTS "Admins can update CV submissions" ON public.hr_cv_submissions;
CREATE POLICY "Owner and admins can update CV submissions"
ON public.hr_cv_submissions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'hr_manager')
  )
);
