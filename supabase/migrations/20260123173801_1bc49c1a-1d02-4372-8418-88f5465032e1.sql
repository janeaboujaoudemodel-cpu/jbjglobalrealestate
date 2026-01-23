-- Fix: Add explicit denial for anonymous users on leads table
-- The authenticated staff policy already exists, just need to block anon access

CREATE POLICY "Deny anonymous read access to leads"
ON public.leads
FOR SELECT
TO anon
USING (false);