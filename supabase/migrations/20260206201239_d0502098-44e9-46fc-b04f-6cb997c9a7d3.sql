-- ============================================
-- Phase 4 Fix #1 Addendum: Revoke anon privileges
-- ============================================
-- Anon currently has arwdDxtm (full access), must be revoked

-- Revoke all from anon role
REVOKE ALL ON TABLE public.studio_projects FROM anon;

-- Revoke from public role (inherited by anon)
REVOKE ALL ON TABLE public.studio_projects FROM public;

-- Grant only to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.studio_projects TO authenticated;

-- Service role keeps full access for admin operations
GRANT ALL ON TABLE public.studio_projects TO service_role;