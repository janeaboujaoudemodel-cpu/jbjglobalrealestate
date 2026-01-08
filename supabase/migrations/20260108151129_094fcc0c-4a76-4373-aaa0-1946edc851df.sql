-- Fix discount_codes: Change from public to authenticated role
DROP POLICY IF EXISTS "Only admins can manage discount codes" ON public.discount_codes;

CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix broker_subscriptions: Remove duplicate policies (keep the more specific ones)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.broker_subscriptions;

-- The remaining policies are properly secured:
-- broker_subscriptions_select: users see own OR admin sees all (authenticated only)
-- broker_subscriptions_insert: users can insert own (authenticated only)
-- broker_subscriptions_update: users update own OR admin updates all (authenticated only)
-- broker_subscriptions_delete: users delete own OR admin deletes all (authenticated only)