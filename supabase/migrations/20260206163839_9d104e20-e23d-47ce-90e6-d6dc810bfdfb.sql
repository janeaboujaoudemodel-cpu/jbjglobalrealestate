-- =========================================
-- P0 FIX 1/3: broker_messages
-- Enable FORCE ROW LEVEL SECURITY
-- =========================================

-- Enable FORCE RLS (service role will now respect RLS policies)
ALTER TABLE public.broker_messages FORCE ROW LEVEL SECURITY;

-- Add comment documenting the security model
COMMENT ON TABLE public.broker_messages IS 
'AI broker conversation messages. Access: Service role (Edge Functions), CRM admins, owners, and assigned brokers. FORCE RLS enabled.';