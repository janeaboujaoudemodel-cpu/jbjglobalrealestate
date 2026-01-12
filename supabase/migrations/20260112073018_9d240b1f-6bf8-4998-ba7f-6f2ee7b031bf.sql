-- Fix: prevent anonymous users from reading leads data
-- RLS is enabled, but anon table privileges can still trigger “publicly readable” scanners.
-- Public lead capture still works via INSERT policies.

REVOKE SELECT ON TABLE public.leads FROM anon;
