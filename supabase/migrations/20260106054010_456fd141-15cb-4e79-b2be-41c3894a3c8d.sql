-- =============================================
-- HARDEN broker_subscriptions RLS POLICIES
-- =============================================

-- Drop existing policies to recreate cleaner ones
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Admins can view all broker subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.broker_subscriptions;

-- Ensure RLS is enabled
ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (prevents owner from bypassing RLS)
ALTER TABLE public.broker_subscriptions FORCE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own subscription
CREATE POLICY "broker_subscriptions_select_own"
ON public.broker_subscriptions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- SELECT: Admins can view all subscriptions
CREATE POLICY "broker_subscriptions_select_admin"
ON public.broker_subscriptions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT: Users can only create their own subscription
CREATE POLICY "broker_subscriptions_insert_own"
ON public.broker_subscriptions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- UPDATE: Users can update their own subscription (limited fields)
CREATE POLICY "broker_subscriptions_update_own"
ON public.broker_subscriptions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- UPDATE: Admins can update any subscription
CREATE POLICY "broker_subscriptions_update_admin"
ON public.broker_subscriptions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE: Only admins can delete subscriptions
CREATE POLICY "broker_subscriptions_delete_admin"
ON public.broker_subscriptions
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- HARDEN memberships RLS POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can create own memberships" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_own_or_admin" ON public.memberships;

-- Ensure RLS is enabled
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner
ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own membership
CREATE POLICY "memberships_select_own"
ON public.memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- SELECT: Admins can view all memberships
CREATE POLICY "memberships_select_admin"
ON public.memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT: Users can only create their own membership
CREATE POLICY "memberships_insert_own"
ON public.memberships
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- UPDATE: Only admins can update memberships (payment status, etc.)
CREATE POLICY "memberships_update_admin"
ON public.memberships
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE: Only admins can delete memberships
CREATE POLICY "memberships_delete_admin"
ON public.memberships
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);