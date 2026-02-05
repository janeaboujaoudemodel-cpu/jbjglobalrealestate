-- Fix overly permissive RLS policy on crm_chat_messages
-- The current policy allows any authenticated user to INSERT with any sender_id
-- This update ensures users can only insert messages with their own user ID as sender_id

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Authenticated users can send chat messages" ON public.crm_chat_messages;

-- Create a new stricter policy that validates sender_id matches auth.uid()
CREATE POLICY "Users can send messages as themselves" 
ON public.crm_chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  sender_id = auth.uid()::text
);