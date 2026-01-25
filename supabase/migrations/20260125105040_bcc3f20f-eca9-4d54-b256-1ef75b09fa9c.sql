-- =====================================================
-- MEMBERSHIPS TABLE: Clean up and secure RLS policies
-- =====================================================

-- First, drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can create their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can read memberships" ON public.memberships;
DROP POLICY IF EXISTS "memberships_admin_all" ON public.memberships;
DROP POLICY IF EXISTS "memberships_admin_update" ON public.memberships;
DROP POLICY IF EXISTS "memberships_delete_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_own_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_own_or_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_own_select" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_own_or_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_own_or_admin" ON public.memberships;
DROP POLICY IF EXISTS "memberships_user_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_user_select" ON public.memberships;

-- Ensure RLS is enabled and forced
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own membership, admins/owners can view all
CREATE POLICY "memberships_select"
ON public.memberships FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- INSERT: Users can only create memberships for themselves
CREATE POLICY "memberships_insert"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own, admins/owners can update any
CREATE POLICY "memberships_update"
ON public.memberships FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- DELETE: Only admins/owners can delete memberships
CREATE POLICY "memberships_delete"
ON public.memberships FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);