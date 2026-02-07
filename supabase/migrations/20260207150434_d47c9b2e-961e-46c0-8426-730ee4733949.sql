-- Fix function privileges for get_owner_email
-- Grant EXECUTE to authenticated so RLS policies can use it
GRANT EXECUTE ON FUNCTION public.get_owner_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_email() TO service_role;
-- Explicitly revoke from anon (public should never need this)
REVOKE EXECUTE ON FUNCTION public.get_owner_email() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_owner_email() FROM public;