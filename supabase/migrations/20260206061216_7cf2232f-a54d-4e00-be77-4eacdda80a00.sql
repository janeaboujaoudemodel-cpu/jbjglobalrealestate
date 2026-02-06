
-- =============================================
-- FIX STUDIO_JOBS SELECT POLICY - REMOVE session_id BYPASS
-- =============================================
-- The current policy "Users can view own jobs" has:
--   USING (user_id = auth.uid() OR session_id IS NOT NULL)
-- 
-- PROBLEM: "session_id IS NOT NULL" allows ANY user (including anon)
-- to read any row with a session_id set. RLS doesn't validate ownership
-- of the session - it just checks if the value exists.
--
-- FIX: Remove the session_id bypass. Only authenticated owners can read.
-- If session-based sharing is needed later, implement via RPC with token validation.

DROP POLICY IF EXISTS "Users can view own jobs" ON public.studio_jobs;

CREATE POLICY "Users can view own jobs"
ON public.studio_jobs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (input_data->>'userId')::uuid = auth.uid()
);

-- Also add admin read access for debugging/support
CREATE POLICY "Admins can view all jobs"
ON public.studio_jobs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
