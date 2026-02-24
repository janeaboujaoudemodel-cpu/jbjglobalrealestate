
-- =============================================
-- FIX 1: user_notifications — owner-only INSERT
-- =============================================

-- Drop the overly permissive authenticated INSERT policy
DROP POLICY IF EXISTS "authenticated_insert_notifications" ON public.user_notifications;

-- Create owner-only INSERT policy using get_owner_email()
CREATE POLICY "owner_insert_notifications"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'email') = public.get_owner_email()
);

-- =============================================
-- FIX 2: admin_tasks — users can view & update their own tasks
-- =============================================

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Users can view their own admin tasks" ON public.admin_tasks;
DROP POLICY IF EXISTS "Users can update their own admin tasks" ON public.admin_tasks;
DROP POLICY IF EXISTS "Users can insert their own admin tasks" ON public.admin_tasks;
DROP POLICY IF EXISTS "Users can delete their own admin tasks" ON public.admin_tasks;

-- Users can view their own tasks (no owner check needed)
CREATE POLICY "users_view_own_tasks"
ON public.admin_tasks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own tasks (mark complete, etc.)
CREATE POLICY "users_update_own_tasks"
ON public.admin_tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Only owner can insert tasks (assign tasks to users)
CREATE POLICY "owner_insert_tasks"
ON public.admin_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'email') = public.get_owner_email()
);

-- Only owner can delete tasks
CREATE POLICY "owner_delete_tasks"
ON public.admin_tasks
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = public.get_owner_email()
);
