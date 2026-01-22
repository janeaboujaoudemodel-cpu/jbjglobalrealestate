-- Fix vip_clients security: force RLS for all users including table owners
-- and clean up duplicate/overlapping SELECT policies

-- Drop duplicate/redundant SELECT policies
DROP POLICY IF EXISTS "Admins can read VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "Admins can view all VIP clients" ON public.vip_clients;
DROP POLICY IF EXISTS "VIP clients can view own profile" ON public.vip_clients;

-- Force RLS even for table owners (critical for security)
ALTER TABLE public.vip_clients FORCE ROW LEVEL SECURITY;

-- Ensure the remaining policies are correct:
-- 1. "Admins can manage VIP clients" - ALL for admins
-- 2. "CRM users can view VIP clients" - SELECT for CRM staff
-- 3. "Users can view own VIP clients" - SELECT for own records
-- 4. "Users can insert VIP clients" - INSERT for own records

-- Add UPDATE policy for users to update their own VIP client records
CREATE POLICY "Users can update own VIP clients"
ON public.vip_clients
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add DELETE policy restricted to admins only
CREATE POLICY "Only admins can delete VIP clients"
ON public.vip_clients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));