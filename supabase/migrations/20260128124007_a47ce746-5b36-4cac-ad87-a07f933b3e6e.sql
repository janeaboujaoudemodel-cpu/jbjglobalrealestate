-- Fix security warnings: Set search_path on hr_update_timestamp function
CREATE OR REPLACE FUNCTION public.hr_update_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- The "RLS Policy Always True" warning is for hr_leave_policy_select and hr_onboarding_tasks_select
-- which are intentionally public read (SELECT only) - this is acceptable for policy/task templates