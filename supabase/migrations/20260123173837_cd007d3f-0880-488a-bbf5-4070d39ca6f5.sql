-- Fix: Add explicit denial for anonymous users on hr_employees table
-- Existing policies handle authenticated access, just need to block anon

CREATE POLICY "Deny anonymous read access to hr_employees"
ON public.hr_employees
FOR SELECT
TO anon
USING (false);