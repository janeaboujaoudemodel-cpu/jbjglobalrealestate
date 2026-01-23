-- Fix leads table public exposure - remove policies that grant SELECT to public role
-- and ensure only authenticated staff can read lead data

-- Drop the problematic public SELECT policies
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Only staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins update leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins delete leads" ON public.leads;

-- Keep the secure authenticated-only policies and rename for clarity:
-- leads_authenticated_select, leads_authenticated_update, leads_authenticated_delete already exist and are correct

-- Create a single unified SELECT policy for authenticated staff only
DROP POLICY IF EXISTS "leads_authenticated_select" ON public.leads;
CREATE POLICY "leads_authenticated_select" ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role) 
    OR is_crm_admin(auth.uid())
    OR is_active_crm_member(auth.uid())
  );

-- Ensure no anon users can SELECT (only INSERT is allowed for lead forms)
-- Verify RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too (prevents bypassing RLS)
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;