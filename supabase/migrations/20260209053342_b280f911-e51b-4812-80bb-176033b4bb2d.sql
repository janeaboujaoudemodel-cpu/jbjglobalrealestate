-- Security Migration: Fix broker_subscriptions permission

-- Add fallback RLS policy for authenticated users to read their own broker subscription
CREATE POLICY "authenticated_read_own_broker_subscription" 
ON broker_subscriptions FOR SELECT 
USING (user_id = auth.uid());