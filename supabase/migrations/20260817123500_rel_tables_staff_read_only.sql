-- Media Ingestion Audit (Aug 17 2026) — finding 3.5
--
-- Every `rel_*` table was created with
--   FOR SELECT TO authenticated USING (true)
-- so *any* authenticated account could read the whole CRM: developer and
-- brokerage contacts, deals, deal payments, and email campaign history. The
-- matching write policy already required `rel_is_owner()`; only read was open.
-- That gap matters as soon as a non-staff account can authenticate at all —
-- an investor or broker portal signup, for instance.
--
-- Checked before writing this: every frontend read of a `rel_*` table lives
-- under `src/pages/owner/*`. No public or broker-facing page selects from any
-- of them, so scoping read to staff does not remove data from any live surface.
--
-- `rel_is_owner()` is reused rather than a new predicate so read and write
-- stay governed by one definition — it already accepts the owner email plus
-- anyone holding owner/admin/super_admin in `user_roles`.
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
    EXECUTE format('DROP POLICY IF EXISTS "rel_auth_read_%s" ON public.%s', t, t);
    EXECUTE format(
      'CREATE POLICY "rel_staff_read_%s" ON public.%s FOR SELECT TO authenticated USING (public.rel_is_owner())',
      t, t
    );
  END LOOP;
END $$;

-- The view inherits the policies of its base tables, but it is owned by the
-- migration role, so make sure it is not a way around them.
ALTER VIEW IF EXISTS public.rel_listing_with_media SET (security_invoker = true);
