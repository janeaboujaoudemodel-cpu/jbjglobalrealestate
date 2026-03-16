
-- FIX 1: esign_fields — drop public USING(true) SELECT policy
DROP POLICY IF EXISTS "Public can view fields by envelope" ON public.esign_fields;

CREATE POLICY "esign_fields_recipient_select" ON public.esign_fields
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM esign_envelopes
      WHERE esign_envelopes.id = esign_fields.envelope_id
        AND esign_envelopes.sender_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  );

-- FIX 2: user_activity_log — drop broad SELECT, scope to own rows
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON public.user_activity_log;

CREATE POLICY "user_activity_log_own_select" ON public.user_activity_log
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  );

-- FIX 3: studio_projects — remove session_id IS NOT NULL branch
DROP POLICY IF EXISTS "studio_projects_owner_select" ON public.studio_projects;
DROP POLICY IF EXISTS "studio_projects_owner_update" ON public.studio_projects;

CREATE POLICY "studio_projects_owner_select" ON public.studio_projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_shared = true);

CREATE POLICY "studio_projects_owner_update" ON public.studio_projects
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "studio_projects_anon_select" ON public.studio_projects
  FOR SELECT TO anon
  USING (session_id = (current_setting('request.headers', true)::json->>'x-session-id') AND session_id IS NOT NULL);

-- Fix child tables
DROP POLICY IF EXISTS "Users can manage project assets" ON public.studio_project_assets;
CREATE POLICY "studio_project_assets_scoped" ON public.studio_project_assets
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage project captions" ON public.studio_captions;
CREATE POLICY "studio_captions_scoped" ON public.studio_captions
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage project clips" ON public.studio_timeline_clips;
CREATE POLICY "studio_timeline_clips_scoped" ON public.studio_timeline_clips
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage AI sessions" ON public.studio_ai_sessions;
CREATE POLICY "studio_ai_sessions_scoped" ON public.studio_ai_sessions
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage exports" ON public.studio_exports;
CREATE POLICY "studio_exports_scoped" ON public.studio_exports
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM studio_projects WHERE user_id = auth.uid()));
