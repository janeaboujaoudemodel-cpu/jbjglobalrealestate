-- ═══════════════════════════════════════════════════════════════
-- 1. user_sessions: Drop old permissive policies
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can update own session" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_session_update" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert" ON public.user_sessions;

-- Scoped insert: anon can insert with null user_id, auth can insert own
CREATE POLICY "user_sessions_insert_v2" ON public.user_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "user_sessions_service_insert_v2" ON public.user_sessions
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Scoped update
CREATE POLICY "user_sessions_update_v2" ON public.user_sessions
  FOR UPDATE TO anon, authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 2. user_interest_profile: Drop old permissive policies
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "System can upsert profile" ON public.user_interest_profile;
DROP POLICY IF EXISTS "user_interest_profile_insert" ON public.user_interest_profile;
DROP POLICY IF EXISTS "System can update profile" ON public.user_interest_profile;

CREATE POLICY "user_interest_profile_auth_insert" ON public.user_interest_profile
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_interest_profile_auth_update" ON public.user_interest_profile
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_interest_profile_svc_insert" ON public.user_interest_profile
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "user_interest_profile_svc_update" ON public.user_interest_profile
  FOR UPDATE TO service_role
  USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 3. user_daily_activity: Drop old permissive policies
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "System can insert daily activity" ON public.user_daily_activity;
DROP POLICY IF EXISTS "user_daily_activity_insert" ON public.user_daily_activity;
DROP POLICY IF EXISTS "System can update daily activity" ON public.user_daily_activity;

CREATE POLICY "user_daily_activity_auth_insert" ON public.user_daily_activity
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_daily_activity_svc_insert" ON public.user_daily_activity
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "user_daily_activity_svc_update" ON public.user_daily_activity
  FOR UPDATE TO service_role
  USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. visitor_sessions: Drop old permissive UPDATE
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "visitor_sessions_update" ON public.visitor_sessions;

CREATE POLICY "visitor_sessions_update_v2" ON public.visitor_sessions
  FOR UPDATE TO anon, authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 5. user_points_ledger: Drop public insert, restrict to service_role
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "System can insert points" ON public.user_points_ledger;