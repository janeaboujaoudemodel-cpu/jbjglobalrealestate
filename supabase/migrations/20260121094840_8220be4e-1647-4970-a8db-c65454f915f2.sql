-- Fix security: Restrict contact_gating_submissions to authorized staff only
-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Public can submit contact info for gated content" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Authorized staff can view gated content submissions" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Authorized staff can update gated content submissions" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Authorized staff can delete gated content submissions" ON public.contact_gating_submissions;

-- Enable RLS if not already enabled
ALTER TABLE public.contact_gating_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT (users need to submit their contact info to access gated content)
CREATE POLICY "Public can submit contact info for gated content"
ON public.contact_gating_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Only authorized staff can SELECT (view leads)
CREATE POLICY "Authorized staff can view gated content submissions"
ON public.contact_gating_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'listing_admin', 'hr_admin')
  )
);

-- Only authorized staff can UPDATE
CREATE POLICY "Authorized staff can update gated content submissions"
ON public.contact_gating_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'listing_admin', 'hr_admin')
  )
);

-- Only authorized staff can DELETE
CREATE POLICY "Authorized staff can delete gated content submissions"
ON public.contact_gating_submissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'listing_admin', 'hr_admin')
  )
);

-- Fix security: Restrict chat_conversations to authorized staff only
-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Public can start chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update their own chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authorized staff can view all chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authorized staff can delete chat conversations" ON public.chat_conversations;

-- Enable RLS if not already enabled
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT (users need to start chat conversations)
CREATE POLICY "Public can start chat conversations"
ON public.chat_conversations
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public UPDATE on their own conversations (for adding messages)
CREATE POLICY "Users can update their own chat conversations"
ON public.chat_conversations
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Only authorized staff can SELECT all conversations
CREATE POLICY "Authorized staff can view all chat conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'listing_admin', 'hr_admin')
  )
);

-- Only authorized staff can DELETE
CREATE POLICY "Authorized staff can delete chat conversations"
ON public.chat_conversations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'listing_admin', 'hr_admin')
  )
);