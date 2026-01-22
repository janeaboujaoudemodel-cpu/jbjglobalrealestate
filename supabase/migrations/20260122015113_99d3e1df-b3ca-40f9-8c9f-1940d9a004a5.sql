-- Fix overly permissive RLS policies on chat_history and leads tables

-- Drop the overly permissive "Users view own session" policy that uses USING (true)
DROP POLICY IF EXISTS "Users view own session" ON public.chat_history;

-- The remaining policies already properly restrict access:
-- - "Users can view own chat history only" requires auth.uid() = user_id OR admin/owner roles
-- - "Staff can read chat history" requires is_authorized_staff()
-- - "Staff can view all chat history" requires is_active_crm_member()

-- Verify chat_history has proper INSERT restrictions (already has rate limiting)
-- No changes needed to INSERT policies

-- For leads table, the "Public insert leads with validation" policy already has email validation and rate limiting
-- The SELECT policies already restrict to staff/admin only
-- No additional changes needed for leads table