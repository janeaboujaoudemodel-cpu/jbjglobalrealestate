
-- Fix the overly permissive RLS policy on employee_status table
-- Drop the "USING (true)" policy and replace with proper role-based access

-- Drop the permissive policy
DROP POLICY IF EXISTS "Authenticated can manage employee status" ON public.employee_status;

-- Create proper RLS policies for employee_status

-- Allow admins/owners to manage all employee statuses
CREATE POLICY "Admins can manage all employee statuses"
ON public.employee_status
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.is_crm_admin(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.is_crm_admin(auth.uid())
);

-- Allow authenticated users to view employee statuses (for directory/org chart purposes)
CREATE POLICY "Authenticated users can view employee statuses"
ON public.employee_status
FOR SELECT
TO authenticated
USING (true);
