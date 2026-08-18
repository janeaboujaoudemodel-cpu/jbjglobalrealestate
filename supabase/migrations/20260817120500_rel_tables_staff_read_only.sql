-- Media Ingestion Audit (Aug 17 2026) — finding 3.5
--
-- The audit reported "all twelve `rel_*` tables are readable by any
-- authenticated user". That was true when they were created
-- (`20260504141024`, which gave all twelve
--   FOR SELECT TO authenticated USING (true)
-- under the name `rel_auth_read_<table>`), but it is NOT the state of the
-- database today, and the difference matters for what this migration does.
--
-- `20260524022402` already re-scoped ten of the twelve to
-- `public.rel_is_owner()`, under the name `rel_owner_read_<table>`. Its table
-- list omitted exactly two:
--
--     rel_media_assets      -- storage paths, titles, kind, per media object
--     rel_listing_media     -- which media asset belongs to which listing
--
-- Those two are the live exposure this migration closes: any account that can
-- authenticate at all — including a future investor or broker portal signup —
-- can currently enumerate every listing media record. The matching write
-- policy already required `rel_is_owner()`; only read was open.
--
-- For the other ten this migration is a consolidation, not a behaviour change.
-- Both legacy policy names are dropped and one canonical `rel_staff_read_*`
-- policy is created per table, so each table ends up with exactly one SELECT
-- policy instead of two permissive policies with identical predicates (RLS
-- OR's permissive policies, so a leftover duplicate is harmless but makes the
-- effective grant hard to read off the schema).
--
-- `rel_is_owner()` is reused rather than a new predicate so read and write
-- stay governed by one definition — it already accepts the owner email plus
-- anyone holding owner/admin/super_admin in `user_roles`.
--
-- Checked before writing this: every frontend read of a `rel_*` table lives
-- under `src/pages/owner/*`. No public or broker-facing page selects from any
-- of them, so scoping read to staff does not remove data from any live
-- surface.
--
-- NOT changed here, deliberately: the `rel-media` and `rel-logos` storage
-- buckets remain public-read. They are public buckets, so any object URL
-- already handed out — in an email, an export, a shared brochure link — would
-- break the moment they are flipped private. That is a product decision rather
-- than a straight security fix, so it is left for an explicit call.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'rel_developers','rel_brokerages','rel_developer_contacts','rel_brokerage_contacts',
    'rel_deals','rel_deal_payments','rel_email_campaigns','rel_email_sends',
    'rel_projects','rel_listings','rel_media_assets','rel_listing_media'])
  LOOP
    -- the original wide-open policy (still live on rel_media_assets and
    -- rel_listing_media; already dropped on the other ten)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rel_auth_read_' || t, t);
    -- the 20260524022402 replacement, superseded by the canonical name below
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rel_owner_read_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rel_staff_read_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.rel_is_owner())',
      'rel_staff_read_' || t, t
    );
  END LOOP;
END $$;

-- The view inherits the policies of its base tables, but it is owned by the
-- migration role, so make sure it is not a way around them.
ALTER VIEW IF EXISTS public.rel_listing_with_media SET (security_invoker = true);
