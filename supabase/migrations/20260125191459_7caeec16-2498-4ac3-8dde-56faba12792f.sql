-- Fix VIP Clients RLS: Restrict access to only client and owner
-- Remove sales_director access from view policy

-- Drop the overly permissive executive_view_all policy
DROP POLICY IF EXISTS "executive_view_all" ON public.vip_clients;

-- Create new strict policy: Only owners can view all VIP clients
CREATE POLICY "owner_view_all" ON public.vip_clients
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role));

-- The existing vip_view_own policy already allows clients to view their own record
-- The existing owner_or_rm_update allows owners or the client to update their own record
-- These are already correctly scoped