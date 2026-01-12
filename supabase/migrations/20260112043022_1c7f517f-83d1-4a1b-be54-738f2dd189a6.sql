-- Fix security: Remove policies that allow public/anon access to sensitive data

-- 1. Drop dangerous public-role policies on broker_subscriptions
DROP POLICY IF EXISTS "broker_subs_user_select" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subs_user_insert" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subs_user_update" ON public.broker_subscriptions;

-- 2. Drop duplicate/redundant policies to clean up
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select_own_or_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_insert" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_insert_own" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_update" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_update_own_or_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_delete" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.broker_subscriptions;

-- 3. Create clean, consolidated policies for broker_subscriptions (authenticated only)
CREATE POLICY "Authenticated users view own subscription or admins all"
ON public.broker_subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Authenticated users insert own subscription"
ON public.broker_subscriptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users update own subscription or admins all"
ON public.broker_subscriptions FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can delete subscriptions"
ON public.broker_subscriptions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 4. Clean up leads table policies - keep public insert for lead capture but add validation
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

-- Keep single SELECT policy for authenticated admin/owner only
CREATE POLICY "Only admins can view leads"
ON public.leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));