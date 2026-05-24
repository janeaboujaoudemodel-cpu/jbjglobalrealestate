
-- 1) Fix rel_* over-permissive SELECT policies
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'rel_brokerage_contacts','rel_developer_contacts','rel_brokerages',
    'rel_developers','rel_deals','rel_deal_payments','rel_email_campaigns',
    'rel_email_sends','rel_projects','rel_listings'
  ];
  polname text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    polname := 'rel_auth_read_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', polname, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rel_auth_read_' || replace(t,'rel_',''), t);
    -- Create owner-scoped SELECT policy
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.rel_is_owner())',
                   'rel_owner_read_' || t, t);
  END LOOP;
END $$;

-- 2) Remove misconfigured public-role policy on project_ai_cache
DROP POLICY IF EXISTS "Service role can manage project AI cache" ON public.project_ai_cache;

-- 3) Tighten Instagram grid storage deletes to folder owner
DROP POLICY IF EXISTS "Authenticated delete instagram grid photos" ON storage.objects;
DROP POLICY IF EXISTS "ig_grid_auth_delete" ON storage.objects;

CREATE POLICY "ig_grid_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'instagram-grid-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
