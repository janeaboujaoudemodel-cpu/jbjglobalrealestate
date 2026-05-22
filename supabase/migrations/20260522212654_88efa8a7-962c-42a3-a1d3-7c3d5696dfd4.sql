
-- 1) best_idea_submissions: pin insertions to the authenticated user
DROP POLICY IF EXISTS "authenticated_submit_ideas" ON public.best_idea_submissions;
CREATE POLICY "authenticated_submit_ideas"
ON public.best_idea_submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2) crm_lead_access_logs: pin inserts to auth.uid() (drop the loose one, keep the strict one)
DROP POLICY IF EXISTS "crm_lead_access_insert" ON public.crm_lead_access_logs;

-- 3) visitor_sessions: remove the NULL-user bypass on UPDATE
DROP POLICY IF EXISTS "visitor_sessions_update_v2" ON public.visitor_sessions;
CREATE POLICY "visitor_sessions_update_v2"
ON public.visitor_sessions
FOR UPDATE
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid())
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

-- 4) esign-certificates: restrict INSERT to service_role only (no anon uploads)
DROP POLICY IF EXISTS "esign_certs_service_insert" ON storage.objects;
CREATE POLICY "esign_certs_service_insert"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'esign-certificates');

-- 5) esign-documents bucket: make PRIVATE so RLS gates downloads
UPDATE storage.buckets SET public = false WHERE id = 'esign-documents';

-- 6) esign_recipients: remove from realtime publication so signing_token is not broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.esign_recipients;
