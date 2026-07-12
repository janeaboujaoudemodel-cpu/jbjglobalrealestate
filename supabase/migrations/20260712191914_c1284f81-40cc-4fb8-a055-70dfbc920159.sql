-- Restore table-level SELECT on public.developers for anon and authenticated.
-- The previous migration revoked SELECT from anon and only re-granted column-level
-- SELECT on a subset, which breaks any select("*") or count("*", { head: true })
-- query issued from public pages (home hero, directory, filters, dashboards).
-- The existing RLS policy "Developers are viewable by everyone" (USING true) already
-- makes this table intentionally public.
GRANT SELECT ON public.developers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developers TO authenticated;
GRANT ALL ON public.developers TO service_role;