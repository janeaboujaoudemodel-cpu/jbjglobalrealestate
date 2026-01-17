-- ============================================
-- SECURITY PATCH PART 3: Complete remaining fixes
-- ============================================

-- Create secure view for public developer info (correct columns, no website_url which may have contact info)
DROP VIEW IF EXISTS public.uae_developers_public;
CREATE VIEW public.uae_developers_public AS
SELECT 
  id, name, slug, logo_url, 
  location_city, location_emirate, description,
  founded_year, headquarters, is_active,
  created_at, updated_at
FROM public.uae_developers
WHERE is_active = true;

-- Grant select on public view to anon for website display
GRANT SELECT ON public.uae_developers_public TO anon, authenticated;

-- chat_history - remove anon insert, only allow service role (via edge function)
DROP POLICY IF EXISTS "chat_hist_insert_session" ON public.chat_history;

-- Allow authenticated users to insert (for logged-in chat)
CREATE POLICY "chat_history_auth_insert" ON public.chat_history
FOR INSERT TO authenticated
WITH CHECK ((session_id IS NOT NULL) AND (length(session_id) > 0));

-- chat_conversations - remove anon insert, only allow service role
DROP POLICY IF EXISTS "chat_conv_insert_validated" ON public.chat_conversations;

-- Allow authenticated users to insert
CREATE POLICY "chat_conversations_auth_insert" ON public.chat_conversations
FOR INSERT TO authenticated
WITH CHECK ((user_email IS NOT NULL) AND (length(user_email) > 0));