-- Fix overly permissive RLS policy on broker_messages
DROP POLICY IF EXISTS "System can insert messages" ON public.broker_messages;

-- Create proper insert policy - only allow from authenticated users or service role
CREATE POLICY "Authenticated users can insert broker messages"
ON public.broker_messages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- Admins can manage all messages
CREATE POLICY "Admins can manage broker messages"
ON public.broker_messages FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner') OR is_crm_admin(auth.uid()));