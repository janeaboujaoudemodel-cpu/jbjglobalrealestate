-- Fix overly permissive RLS policies on employee_notifications
-- This is an internal AI simulation table - employee_id is a text field, not user_id

-- Drop the problematic policies
DROP POLICY IF EXISTS "System can insert notifications" ON public.employee_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.employee_notifications;

-- Create properly scoped policies for authenticated employees only
CREATE POLICY "Authenticated employees can insert notifications"
ON public.employee_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_crm_member(auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Employees can update notifications (mark as read)
CREATE POLICY "Authenticated employees can update notifications"
ON public.employee_notifications
FOR UPDATE
TO authenticated
USING (
  public.is_active_crm_member(auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  public.is_active_crm_member(auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'owner'::app_role)
);