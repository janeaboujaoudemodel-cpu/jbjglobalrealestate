
-- =========================================
-- P0 FIX 1: broker_messages
-- Remove service_role USING (true) bypass
-- =========================================

-- Drop the permissive service_role policy
DROP POLICY IF EXISTS broker_messages_service_all ON public.broker_messages;

-- Add comment documenting the fix
COMMENT ON TABLE public.broker_messages IS 
'AI broker conversation messages. FORCE RLS enabled. Service role must respect RLS (no bypass policy). Access via conversation ownership, escalation, or admin roles.';
