-- ======================================================
-- SECURITY FIX: Remove overly permissive RLS policies 
-- for email_verifications and phone_verifications tables
-- These tables should ONLY be accessible via service_role 
-- (edge functions), not directly by anon/authenticated users
-- ======================================================

-- Drop overly permissive INSERT policies for email_verifications
DROP POLICY IF EXISTS "Service can insert verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Service can insert email verifications" ON public.email_verifications;

-- Drop overly permissive UPDATE policies for email_verifications
DROP POLICY IF EXISTS "Service can update verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Service can update email verifications" ON public.email_verifications;

-- Drop overly permissive INSERT policies for phone_verifications
DROP POLICY IF EXISTS "Service can insert phone verifications" ON public.phone_verifications;

-- Drop overly permissive UPDATE policies for phone_verifications
DROP POLICY IF EXISTS "Service can update phone verifications" ON public.phone_verifications;

-- Drop any other "true" policies that might exist
DROP POLICY IF EXISTS "Allow service insert" ON public.email_verifications;
DROP POLICY IF EXISTS "Allow service update" ON public.email_verifications;
DROP POLICY IF EXISTS "Allow service insert" ON public.phone_verifications;
DROP POLICY IF EXISTS "Allow service update" ON public.phone_verifications;

-- Verify RLS is still enabled (it should be)
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Note: Edge functions using SUPABASE_SERVICE_ROLE_KEY bypass RLS entirely,
-- so they can still INSERT/UPDATE these tables. By removing the permissive 
-- policies, we prevent any direct manipulation by anon/authenticated users.