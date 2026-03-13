-- Harden meeting_requests: replace permissive policy with owner-scoped
DROP POLICY IF EXISTS "Owner can manage all meeting requests" ON public.meeting_requests;
CREATE POLICY "Owner can manage all meeting requests"
  ON public.meeting_requests
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'janeaboujaoudenails@gmail.com'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'janeaboujaoudenails@gmail.com'
  );

-- Harden email_signatures: replace permissive policy with owner-scoped
DROP POLICY IF EXISTS "Authenticated users can manage email signatures" ON public.email_signatures;
CREATE POLICY "Owner can manage email signatures"
  ON public.email_signatures
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'janeaboujaoudenails@gmail.com'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'janeaboujaoudenails@gmail.com'
  );