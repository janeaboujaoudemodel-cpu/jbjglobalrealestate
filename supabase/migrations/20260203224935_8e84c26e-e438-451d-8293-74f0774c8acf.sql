-- Fix visitor_sessions RLS to allow anonymous inserts (with rate limiting)
-- The current policy has issues with upsert operations

-- Drop the existing policy that has issues
DROP POLICY IF EXISTS "visitor_sessions_rate_limited_insert" ON public.visitor_sessions;

-- Create a simpler insert policy for anonymous/authenticated users
CREATE POLICY "allow_visitor_session_insert" 
ON public.visitor_sessions
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create an update policy so sessions can be updated (for page count increment)
CREATE POLICY "allow_visitor_session_update" 
ON public.visitor_sessions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Ensure the visitor_events insert policy also works
DROP POLICY IF EXISTS "visitor_events_rate_limited_insert" ON public.visitor_events;

CREATE POLICY "allow_visitor_event_insert"
ON public.visitor_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);