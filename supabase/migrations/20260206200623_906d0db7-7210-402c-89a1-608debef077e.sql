-- ============================================
-- Phase 4 Fix #1: studio_projects RLS Hardening
-- ============================================
-- Part 1: Fix insecure INSERT policy
-- Part 2: Scope all policies to authenticated only
-- ============================================

-- 1) Drop insecure INSERT policy
DROP POLICY IF EXISTS "Users can insert projects" ON public.studio_projects;

-- 2) Create strict ownership INSERT policy (authenticated only)
CREATE POLICY "studio_projects_owner_insert" ON public.studio_projects
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3) Enforce user_id integrity (table is empty, safe to add NOT NULL)
ALTER TABLE public.studio_projects
  ALTER COLUMN user_id SET NOT NULL;

-- 4) Enable FORCE RLS
ALTER TABLE public.studio_projects
  FORCE ROW LEVEL SECURITY;

-- ============================================
-- Part 2: Replace remaining TO public policies
-- ============================================

-- 5A) DELETE - scope to authenticated
DROP POLICY IF EXISTS "Users can delete own projects" ON public.studio_projects;
CREATE POLICY "studio_projects_owner_delete" ON public.studio_projects
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5B) UPDATE - scope to authenticated
DROP POLICY IF EXISTS "Users can update own projects" ON public.studio_projects;
CREATE POLICY "studio_projects_owner_update" ON public.studio_projects
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR session_id IS NOT NULL);

-- 5C) SELECT - scope to authenticated
DROP POLICY IF EXISTS "Users can view own projects" ON public.studio_projects;
CREATE POLICY "studio_projects_owner_select" ON public.studio_projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR session_id IS NOT NULL OR is_shared = true);