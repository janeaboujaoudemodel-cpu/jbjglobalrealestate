-- Fix RLS policies for vip_clients, broker_subscriptions, visitor_events, profiles

-- 1. Fix vip_clients: Remove the problematic deny_anonymous_access policy
-- The other policies already properly restrict access
DROP POLICY IF EXISTS "deny_anonymous_access" ON public.vip_clients;

-- Make user_id NOT NULL to prevent security issues (users must be associated)
-- First, delete any orphaned records
DELETE FROM public.vip_clients WHERE user_id IS NULL;

-- Then alter the column
ALTER TABLE public.vip_clients ALTER COLUMN user_id SET NOT NULL;

-- 2. Fix broker_subscriptions: Remove duplicate policies
DROP POLICY IF EXISTS "broker_subscriptions_admin_update" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_own_insert" ON public.broker_subscriptions;

-- 3. Fix visitor_events: Add admin SELECT policy and allow service role insert
DROP POLICY IF EXISTS "Admin can view all visitor events" ON public.visitor_events;

-- Create proper admin viewing policy using has_role
CREATE POLICY "admins_can_view_visitor_events"
ON public.visitor_events
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- 4. Fix profiles: Remove duplicate SELECT policies
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Keep only "Admins can read all profiles" and "Users can read own profile" which are cleaner

-- 5. Add admin INSERT policy for vip_clients (currently only owner can insert)
DROP POLICY IF EXISTS "owner_insert" ON public.vip_clients;
CREATE POLICY "admin_or_owner_insert"
ON public.vip_clients
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 6. Add admin SELECT policy for vip_clients
CREATE POLICY "admin_view_all"
ON public.vip_clients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 7. Ensure broker_subscriptions has user SELECT policy
DROP POLICY IF EXISTS "broker_subscriptions_secure_select" ON public.broker_subscriptions;

CREATE POLICY "users_can_view_own_subscription"
ON public.broker_subscriptions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'owner'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);